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

    // Fetch invoice summary from row 96
    // Format: "Invoice Sent: Len: $78 + $4 = $82, Sel: $25 + $5 = $30, Abi: $22 + $15 + $6 = $43"
    // Also check a wider range in case it's in a different column
    const invoiceRange = `${targetSheetName}!A96:AA96`;
    const invoiceUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${invoiceRange}?key=${API_KEY}`;
    const invoiceResponse = await fetch(invoiceUrl);
    
    let lenInvoice = 0, selInvoice = 0, danielInvoice = 0, abiInvoice = 0;
    
    if (invoiceResponse.ok) {
      const invoiceData = await invoiceResponse.json();
      const invoiceRows = invoiceData.values || [];
      
      // Join all cells in row 96, handling cases where text might be split
      const invoiceText = invoiceRows[0]?.join(' ') || '';
      
      // Also check if invoice summary might be in a single cell (like B96)
      // Try to find any cell containing "Invoice" or person names
      let fullInvoiceText = invoiceText;
      for (let i = 0; i < invoiceRows[0]?.length; i++) {
        const cell = invoiceRows[0]?.[i] || '';
        if (cell.toLowerCase().includes('invoice') || 
            cell.toLowerCase().includes('len:') || 
            cell.toLowerCase().includes('sel:') ||
            cell.toLowerCase().includes('abi:') ||
            cell.toLowerCase().includes('daniel:')) {
          // If we find a cell with invoice info, use that and surrounding cells
          const start = Math.max(0, i - 2);
          const end = Math.min(invoiceRows[0].length, i + 10);
          fullInvoiceText = invoiceRows[0].slice(start, end).join(' ');
          break;
        }
      }
      
      // Parse invoice summary text - more flexible regex
      // Example: "Invoice Sent: Len: $78 + $4 = $82, Sel: $25 + $5 = $30, Abi: $22 + $15 + $6 = $43"
      // Also handles: "Len: $78 + $4 = $82" or "Len: $82" formats
      // Try multiple patterns to catch different formats
      const lenMatch = fullInvoiceText.match(/Len:\s*[^=,]*=\s*\$(\d+)/i) || 
                      fullInvoiceText.match(/Len:\s*\$(\d+)/i);
      const selMatch = fullInvoiceText.match(/Sel:\s*[^=,]*=\s*\$(\d+)/i) || 
                      fullInvoiceText.match(/Sel:\s*\$(\d+)/i);
      const danielMatch = fullInvoiceText.match(/Daniel:\s*[^=,]*=\s*\$(\d+)/i) || 
                         fullInvoiceText.match(/Daniel:\s*\$(\d+)/i);
      const abiMatch = fullInvoiceText.match(/Abi:\s*[^=,]*=\s*\$(\d+)/i) || 
                      fullInvoiceText.match(/Abi:\s*\$(\d+)/i);
      
      lenInvoice = lenMatch ? parseFloat(lenMatch[1]) : 0;
      selInvoice = selMatch ? parseFloat(selMatch[1]) : 0;
      danielInvoice = danielMatch ? parseFloat(danielMatch[1]) : 0;
      abiInvoice = abiMatch ? parseFloat(abiMatch[1]) : 0;
      
    }

    // Always add Sel's extra to invoice summary if it exists
    // For past periods, invoice summary might not include extras mentioned in row 7
    if (selExtra > 0) {
      if (selInvoice > 0) {
        // Invoice summary exists - add extra to it
        // This handles cases where invoice shows base amount but extra is separate
        selInvoice = selInvoice + selExtra;
      } else if (selCurrent > 0) {
        // No invoice summary found - use current + extra
        selInvoice = selCurrent + selExtra;
      }
    }

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
    let currentBatch = 1;

    // Start from row 4 (index 4) since your data starts at row 5 in the sheet
    // Skip header rows (row 3) and first rows
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      
      // Column B (index 1) contains the Status
      const status = row[1]?.toLowerCase() || '';
      
      // Check if this is an empty row (batch separator)
      if (!status) {
        // Empty row means new batch starts next
        currentBatch++;
        continue;
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
        batchNumber: currentBatch
      };

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

