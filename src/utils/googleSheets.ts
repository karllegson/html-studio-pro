/**
 * Google Sheets Integration
 * Fetches task status data from Google Sheets
 */

import { getSheetName } from '@/components/SheetNameConfig';

export interface SheetTask {
  date: string;
  status: string;
  company: string;
  googleDocLink: string;
  type: string;
  teamworkLink: string;
  price: string;
  htmlStudioLink: string;
  author: string;
  notes: string;
  batchNumber?: number; // Batch grouping based on empty rows
  batchCompany?: string; // Company name for the batch (from batch marker or first task)
}

export interface SheetTaskStats {
  ready: number;
  inProgress: number;
  notStarted: number;
  total: number;
  tasks: SheetTask[];
}

/**
 * Fetch task statistics from Google Sheets
 * Uses Google Sheets API v4 with API key
 */
export interface PersonEarnings {
  name: string;
  currentPeriod: number;
  invoiceSummary: number; // From "Invoice Sent..." in row 96
}

export interface EarningsData {
  earnings: PersonEarnings[];
  currentSheetName: string;
}

/**
 * Generate list of available pay periods (e.g., Posting 022, Posting 021, etc.)
 * Goes back 10 periods from current
 */
export function generatePayPeriods(currentSheetName: string): string[] {
  const match = currentSheetName.match(/(.+\s)(\d+)$/);
  if (!match) return [currentSheetName];
  
  const prefix = match[1]; // "Posting "
  const currentNumber = parseInt(match[2]); // 22
  const padding = match[2].length; // 3 for "022"
  
  const periods: string[] = [];
  // Generate current and 9 previous periods
  for (let i = 0; i < 10; i++) {
    const number = currentNumber - i;
    if (number > 0) {
      periods.push(`${prefix}${number.toString().padStart(padding, '0')}`);
    }
  }
  
  return periods;
}

/**
 * Fetch earnings data from Google Sheets for a specific pay period
 * Reads current period from earnings table (row 5)
 * Reads invoice summary from row 96
 */
export async function fetchEarningsData(sheetName?: string): Promise<EarningsData | null> {
  try {
    const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_SHEET_ID;
    // Use provided sheet name or default to current from config
    const targetSheetName = sheetName || getSheetName(); // e.g., "Posting 022"

    if (!API_KEY || !SHEET_ID) {
      console.warn('Google Sheets API credentials not configured');
      return null;
    }

    // Fetch current period earnings (row 5, columns L-O) and extras (row 7)
    const currentRange = `${targetSheetName}!L5:O7`;
    const currentUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${currentRange}?key=${API_KEY}`;
    const currentResponse = await fetch(currentUrl);
    
    if (!currentResponse.ok) {
      console.error('Failed to fetch current earnings');
      return null;
    }

    const currentData = await currentResponse.json();
    const currentRows = currentData.values || [];

    // Parse current period earnings (row 5)
    const lenCurrent = parseFloat(currentRows[0]?.[0]?.replace('$', '') || '0');
    const selCurrent = parseFloat(currentRows[0]?.[1]?.replace('$', '') || '0');
    const danielCurrent = parseFloat(currentRows[0]?.[2]?.replace('$', '') || '0');
    const abiCurrent = parseFloat(currentRows[0]?.[3]?.replace('$', '') || '0');

    // Parse extras from row 7 (if present)
    // Format: "Sel: $30 (from last" or similar
    const extraText = currentRows[2]?.[1] || ''; // Row 7, column M
    let selExtra = 0;
    if (extraText) {
      // Try to extract dollar amount from extra text
      const extraMatch = extraText.match(/\$(\d+)/);
      if (extraMatch) {
        selExtra = parseFloat(extraMatch[1]);
      }
    }

    // Fetch invoice summary from row 96 (and nearby rows 95-97 in case it's shifted)
    // Format: "Invoice Sent: Len: $78 + $4 = $82, Sel: $25 + $5 = $30, Abi: $22 + $15 + $6 = $43"
    // Check rows 95-97 to handle cases where the summary might be in a different row
    const invoiceRange = `${targetSheetName}!A95:AA97`;
    const invoiceUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${invoiceRange}?key=${API_KEY}`;
    const invoiceResponse = await fetch(invoiceUrl);
    
    let lenInvoice = 0, selInvoice = 0, danielInvoice = 0, abiInvoice = 0;
    
    if (invoiceResponse.ok) {
      const invoiceData = await invoiceResponse.json();
      const invoiceRows = invoiceData.values || [];
      
      // Find the row that contains the invoice summary (person names with dollar amounts)
      // Usually row 96 (index 1), but check all rows
      let invoiceRowIndex = -1;
      let invoiceRow: string[] = [];
      
      for (let rowIdx = 0; rowIdx < invoiceRows.length; rowIdx++) {
        const row = invoiceRows[rowIdx] || [];
        const rowText = row.join(' ').toLowerCase();
        // Look for row with multiple person names and dollar signs
        const personCount = (rowText.match(/(len|sel|daniel|abi):/g) || []).length;
        const dollarCount = (rowText.match(/\$/g) || []).length;
        if (personCount >= 2 && dollarCount >= 2) {
          invoiceRowIndex = rowIdx;
          invoiceRow = row;
          break;
        }
      }
      
      // Fallback to row 96 (index 1) if no match found
      if (invoiceRowIndex < 0) {
        invoiceRowIndex = 1; // Row 96 (0-indexed: 0=95, 1=96, 2=97)
        invoiceRow = invoiceRows[invoiceRowIndex] || [];
      }
      
      // Get the full invoice text from the invoice row we found
      // The invoice summary might be in a single cell (merged) or split across multiple cells
      const allCells = invoiceRow;
      
      // Strategy 1: Find the cell containing "Invoice" or "Sent" - this is usually the main cell
      let fullInvoiceText = '';
      let invoiceCellIndex = -1;
      
      for (let i = 0; i < allCells.length; i++) {
        const cell = allCells[i] || '';
        const cellLower = cell.toLowerCase();
        if (cellLower.includes('invoice') || cellLower.includes('sent')) {
          invoiceCellIndex = i;
          // This cell likely contains the full invoice text
          fullInvoiceText = cell.trim();
          break;
        }
      }
      
      // Strategy 2: If no "Invoice" or "Sent" found, look for cells with person names + dollar amounts
      // This handles cases where the invoice summary doesn't have those keywords
      if (!fullInvoiceText || fullInvoiceText.length < 10) {
        for (let i = 0; i < allCells.length; i++) {
          const cell = allCells[i] || '';
          const cellLower = cell.toLowerCase();
          // Look for cell containing person names with dollar signs (e.g., "Len: $82, Sel: $95")
          if ((cellLower.includes('len:') || cellLower.includes('sel:') || 
               cellLower.includes('daniel:') || cellLower.includes('abi:')) &&
              cell.includes('$')) {
            invoiceCellIndex = i;
            fullInvoiceText = cell.trim();
            // Get surrounding cells in case it's split
            const start = Math.max(0, i - 1);
            const end = Math.min(allCells.length, i + 2);
            const combined = allCells.slice(start, end).join(' ').trim();
            // Use combined if it has more person names
            const personCount = (combined.match(/(len|sel|daniel|abi):/gi) || []).length;
            if (personCount > 1) {
              fullInvoiceText = combined;
            }
            break;
          }
        }
      }
      
      // Strategy 3: If invoice cell found but text seems incomplete, get surrounding cells
      if (invoiceCellIndex >= 0 && fullInvoiceText.length < 50) {
        const start = Math.max(0, invoiceCellIndex - 1);
        const end = Math.min(allCells.length, invoiceCellIndex + 3);
        const expanded = allCells.slice(start, end).join(' ').trim();
        // Use expanded if it has more content
        if (expanded.length > fullInvoiceText.length) {
          fullInvoiceText = expanded;
        }
      }
      
      // Strategy 4: If still no good match, join all cells that contain dollar signs and person names
      if (!fullInvoiceText || !fullInvoiceText.includes('$') || 
          !fullInvoiceText.match(/(len|sel|daniel|abi):/i)) {
        const relevantCells = allCells.filter(cell => {
          if (!cell) return false;
          const cellLower = cell.toLowerCase();
          return cell.includes('$') && 
                 (cellLower.includes('len:') || cellLower.includes('sel:') || 
                  cellLower.includes('daniel:') || cellLower.includes('abi:'));
        });
        if (relevantCells.length > 0) {
          fullInvoiceText = relevantCells.join(' ').trim();
        }
      }
      
      // Strategy 5: Final fallback - join all non-empty cells
      if (!fullInvoiceText || fullInvoiceText.length < 10) {
        const nonEmptyCells = allCells.filter(cell => cell && cell.trim().length > 0);
        fullInvoiceText = nonEmptyCells.join(' ').trim();
      }
      
      // Parse invoice summary text - prioritize amount after "=" sign
      // Example: "Invoice Sent: Len: $78 + $4 = $82, Sel: $65 + $30 = $95, Abi: $22 + $15 + $6 = $43"
      // Format: "Name: $X [+ $Y] = $TOTAL" - we want the TOTAL after "="
      
      // Helper function to extract amount after = sign, or just the amount if no =
      const extractAmount = (text: string, name: string): number => {
        // First try to match "Name: ... = $TOTAL" (with = sign)
        // Pattern: "Name:" followed by anything (non-greedy) up to "=", then capture the number after "$"
        // Use .*? (non-greedy) to match up to the first "=", then capture the number
        const withEquals = new RegExp(`${name}:\\s*.*?=\\s*\\$(\\d+)`, 'i');
        const matchWithEquals = text.match(withEquals);
        if (matchWithEquals && matchWithEquals[1]) {
          const amount = parseFloat(matchWithEquals[1]);
          if (amount > 0) {
            return amount;
          }
        }
        
        // Alternative pattern: Match "Name: $X + $Y = $TOTAL" more explicitly
        // This handles cases where the pattern might be slightly different
        const explicitPattern = new RegExp(`${name}:\\s*\\$\\d+\\s*\\+\\s*\\$\\d+\\s*=\\s*\\$(\\d+)`, 'i');
        const explicitMatch = text.match(explicitPattern);
        if (explicitMatch && explicitMatch[1]) {
          const amount = parseFloat(explicitMatch[1]);
          if (amount > 0) {
            return amount;
          }
        }
        
        // Fallback: match "Name: $AMOUNT" (no = sign) - get the FIRST amount
        const withoutEquals = new RegExp(`${name}:\\s*\\$(\\d+)`, 'i');
        const matchWithoutEquals = text.match(withoutEquals);
        if (matchWithoutEquals && matchWithoutEquals[1]) {
          return parseFloat(matchWithoutEquals[1]);
        }
        
        return 0;
      };
      
      lenInvoice = extractAmount(fullInvoiceText, 'Len');
      danielInvoice = extractAmount(fullInvoiceText, 'Daniel');
      abiInvoice = extractAmount(fullInvoiceText, 'Abi');
      
      // Special handling for Sel - find all dollar amounts after "Sel:" and take the LAST one
      // This works for formats like "Sel: $65 + $30 = $95" - the last amount is after =
      const selIndex = fullInvoiceText.toLowerCase().indexOf('sel:');
      if (selIndex >= 0) {
        // Get text starting from "Sel:" up to the next person or end
        const selText = fullInvoiceText.substring(selIndex);
        // Find where Sel's section ends (next person name or comma before next person)
        const nextPersonMatch = selText.match(/,\s*(Len|Daniel|Abi):/i);
        const selSection = nextPersonMatch ? selText.substring(0, nextPersonMatch.index) : selText;
        
        // Find ALL dollar amounts in Sel's section
        const allAmounts = selSection.match(/\$(\d+)/g);
        if (allAmounts && allAmounts.length > 0) {
          // Get the LAST amount (should be after = sign)
          const lastAmount = allAmounts[allAmounts.length - 1];
          selInvoice = parseFloat(lastAmount.replace('$', ''));
        } else {
          // Fallback to helper function
          selInvoice = extractAmount(fullInvoiceText, 'Sel');
        }
      } else {
        // No "Sel:" found, use helper function
        selInvoice = extractAmount(fullInvoiceText, 'Sel');
      }
      
      // Debug: log what we parsed
      console.log('=== INVOICE PARSING DEBUG ===');
      console.log('Sheet:', targetSheetName);
      console.log('Invoice row index (95=0, 96=1, 97=2):', invoiceRowIndex);
      console.log('All cells in invoice row:', invoiceRow);
      console.log('Invoice cell index:', invoiceCellIndex);
      console.log('Full invoice text:', fullInvoiceText);
      console.log('Full invoice text length:', fullInvoiceText.length);
      
      // Test Sel extraction specifically (reuse selIndex from above)
      if (selIndex >= 0) {
        const selText = fullInvoiceText.substring(selIndex);
        const nextPersonMatch = selText.match(/,\s*(Len|Daniel|Abi):/i);
        const selSection = nextPersonMatch ? selText.substring(0, nextPersonMatch.index) : selText;
        const allAmounts = selSection.match(/\$(\d+)/g);
        
        console.log('Sel section text:', selSection);
        console.log('All amounts found:', allAmounts);
        console.log('Last amount (used):', allAmounts ? allAmounts[allAmounts.length - 1] : 'none');
      }
      console.log('Sel final amount:', selInvoice);
      
      // Show text around Sel if amount seems wrong
      if (fullInvoiceText.toLowerCase().includes('sel:')) {
        const selIndex = fullInvoiceText.toLowerCase().indexOf('sel:');
        const contextStart = Math.max(0, selIndex - 10);
        const contextEnd = Math.min(fullInvoiceText.length, selIndex + 80);
        console.log('Text around Sel (index', selIndex, '):', fullInvoiceText.substring(contextStart, contextEnd));
      }
      
      console.log('Parsed amounts - Len:', lenInvoice, 'Sel:', selInvoice, 'Daniel:', danielInvoice, 'Abi:', abiInvoice);
      console.log('=== END DEBUG ===');
      
    }

    // Note: Invoice summary already includes extras (e.g., "Sel: $65 + $30 = $95")
    // So we don't need to add extra separately - the regex captures the total after "="

    // Fallback: If invoice summary not found, use current period + extras
    // This handles cases where invoice summary might not be in row 96 for past periods
    if (selInvoice === 0 && selCurrent > 0) {
      selInvoice = selCurrent + selExtra;
    }
    if (lenInvoice === 0 && lenCurrent > 0) {
      lenInvoice = lenCurrent;
    }
    if (danielInvoice === 0 && danielCurrent > 0) {
      danielInvoice = danielCurrent;
    }
    if (abiInvoice === 0 && abiCurrent > 0) {
      abiInvoice = abiCurrent;
    }

    return {
      earnings: [
        {
          name: 'Len',
          currentPeriod: lenCurrent,
          invoiceSummary: lenInvoice
        },
        {
          name: 'Sel',
          currentPeriod: selCurrent,
          invoiceSummary: selInvoice
        },
        {
          name: 'Daniel',
          currentPeriod: danielCurrent,
          invoiceSummary: danielInvoice
        },
        {
          name: 'Abi',
          currentPeriod: abiCurrent,
          invoiceSummary: abiInvoice
        }
      ],
      currentSheetName: targetSheetName
    };
  } catch (error) {
    console.error('Error fetching earnings data:', error);
    return null;
  }
}

export async function fetchSheetTaskStats(): Promise<SheetTaskStats | null> {
  try {
    const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_SHEET_ID;
    // Get sheet name from localStorage (configurable in UI)
    const sheetName = getSheetName();
    const RANGE = `${sheetName}!A:K`;

    if (!API_KEY || !SHEET_ID) {
      console.warn('Google Sheets API credentials not configured');
      return null;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch Google Sheets data:', response.statusText);
      return null;
    }

    const data = await response.json();
    const rows = data.values || [];

    let ready = 0;
    let inProgress = 0;
    let notStarted = 0;
    const tasks: SheetTask[] = [];
    let currentBatch: number | null = null;
    let batchCounter = 1;
    let batchCompanyMap: Record<number, string> = {}; // Store company name for each batch
    
    console.log('Starting batch detection...');

    // Start from row 1 (index 1) to catch all batches, including the first one
    // Row 0 is typically headers, but we'll check all rows to find batch markers
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row) continue;
      
      // Column B (index 1) contains the Status
      const status = row[1]?.toLowerCase() || '';
      // Column E (index 4) contains the Type
      const type = row[4]?.toLowerCase() || '';
      
      // Debug: log first few rows to see what we're processing
      if (i <= 10) {
        console.log(`Row ${i + 1}: Status="${row[1] || ''}", Company="${row[2] || ''}", Type="${row[4] || ''}"`);
      }
      
      // Skip header rows - if Status column contains "Status" or Type column contains "Type", it's likely a header
      if (i <= 3 && (status.includes('status') || type.includes('type') || row[0]?.toLowerCase().includes('date'))) {
        console.log(`Skipping header row ${i + 1}`);
        continue;
      }
      
      // Check if Type column contains "Batch in Progress" FIRST - this indicates a new batch starts
      // This check must come before empty row check because batch marker might have empty status/company
      // Check for variations: "batch in progress", "Batch In Progress", "BATCH IN PROGRESS", "Batch In Pro..." (truncated), etc.
      const typeNormalized = type.trim();
      // More flexible matching - check if type contains both "batch" and "progress" (case insensitive)
      // Also handle truncated versions like "Batch In Pro..."
      const typeLower = typeNormalized.toLowerCase();
      const hasBatch = typeLower.includes('batch');
      const hasProgress = typeLower.includes('progress') || typeLower.includes('pro'); // Handle "Batch In Pro..." truncated
      
      if (hasBatch && hasProgress) {
        // New batch detected - increment batch counter and set current batch
        currentBatch = batchCounter;
        // Try to get company name from this row (Company column is index 2)
        const batchCompany = row[2]?.trim() || '';
        if (batchCompany) {
          batchCompanyMap[currentBatch] = batchCompany;
          console.log(`Batch ${currentBatch} started at row ${i + 1}, company: "${batchCompany}", type: "${row[4]}"`);
        } else {
          console.log(`Batch ${currentBatch} started at row ${i + 1}, type: "${row[4]}" (no company in batch marker row)`);
        }
        batchCounter++;
        continue; // Skip this row as it's just a batch marker
      }
      
      // Debug: log rows that might be batch markers but weren't detected
      if (typeNormalized && (typeLower.includes('batch') || typeLower.includes('progress') || typeLower.includes('pro'))) {
        console.log(`Row ${i + 1}: Type "${row[4]}" might be a batch marker but didn't match - hasBatch: ${hasBatch}, hasProgress: ${hasProgress}`);
      }
      
      // Check if this is an empty row - this marks the end of the current batch
      // An empty row is one where key columns (Status, Company) are empty
      const isEmptyRow = !status && (!row[0] || row[0].trim() === '') && (!row[2] || row[2].trim() === '');
      
      if (isEmptyRow) {
        // Empty row marks the end of the current batch
        if (currentBatch !== null) {
          console.log(`Batch ${currentBatch} ended at row ${i + 1} (empty row)`);
        }
        currentBatch = null;
        continue; // Skip empty rows
      }

      // Parse task data from columns:
      // A=Date, B=Status, C=Company, D=Google Doc, E=Type, F=Teamwork, G=Price, H=HTML Studio, I=Author, J=Notes
      const task: SheetTask = {
        date: row[0] || '',
        status: row[1] || '',
        company: row[2] || '',
        googleDocLink: row[3] || '',
        type: row[4] || '',
        teamworkLink: row[5] || '',
        price: row[6] || '',
        htmlStudioLink: row[7] || '',
        author: row[8] || '',
        notes: row[9] || '',
        batchNumber: currentBatch !== null ? currentBatch : undefined, // Only set batchNumber if in a batch
        batchCompany: currentBatch !== null ? batchCompanyMap[currentBatch] : undefined // Store batch company name
      };
      
      // If task is in a batch and we don't have a company name for the batch yet, use this task's company
      if (currentBatch !== null && task.company && !batchCompanyMap[currentBatch]) {
        batchCompanyMap[currentBatch] = task.company;
        console.log(`Batch ${currentBatch} company set to "${task.company}" from first task`);
      }
      
      // Update task's batchCompany from the map (in case it was set from batch marker or first task)
      if (currentBatch !== null && batchCompanyMap[currentBatch]) {
        task.batchCompany = batchCompanyMap[currentBatch];
      }
      
      if (currentBatch !== null) {
        console.log(`Task "${task.company}" (row ${i + 1}) assigned to batch ${currentBatch}`);
      } else {
        console.log(`Task "${task.company}" (row ${i + 1}) is NOT in a batch (standalone task)`);
      }

      tasks.push(task);
      
      if (status.includes('ready')) {
        ready++;
      } else if (status.includes('batch') || status.includes('progress')) {
        inProgress++;
      } else if (status.includes('not') || status.includes('new')) {
        notStarted++;
      }
    }

    console.log('Parsed stats:', { ready, inProgress, notStarted, total: ready + inProgress + notStarted, tasksCount: tasks.length });

    return {
      ready,
      inProgress,
      notStarted,
      total: ready + inProgress + notStarted,
      tasks
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return null;
  }
}

