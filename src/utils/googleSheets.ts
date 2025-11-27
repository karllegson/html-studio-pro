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
 * Fetch earnings data from Google Sheets
 * Reads current period from earnings table (row 5)
 * Reads invoice summary from row 96
 */
export async function fetchEarningsData(): Promise<EarningsData | null> {
  try {
    const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_SHEET_ID;
    const currentSheetName = getSheetName(); // e.g., "Posting 022"

    if (!API_KEY || !SHEET_ID) {
      console.warn('Google Sheets API credentials not configured');
      return null;
    }

    // Fetch current period earnings (row 5, columns L-O)
    const currentRange = `${currentSheetName}!L5:O5`;
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

    // Fetch invoice summary from row 96
    // Format: "Invoice Sent: Len: $78 + $4 = $82, Sel: $25 + $5 = $30, Abi: $22 + $15 + $6 = $43"
    const invoiceRange = `${currentSheetName}!A96:Z96`;
    const invoiceUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${invoiceRange}?key=${API_KEY}`;
    const invoiceResponse = await fetch(invoiceUrl);
    
    let lenInvoice = 0, selInvoice = 0, danielInvoice = 0, abiInvoice = 0;
    
    if (invoiceResponse.ok) {
      const invoiceData = await invoiceResponse.json();
      const invoiceRows = invoiceData.values || [];
      const invoiceText = invoiceRows[0]?.join(' ') || '';
      
      // Parse invoice summary text
      // Example: "Invoice Sent: Len: $78 + $4 = $82, Sel: $25 + $5 = $30, Abi: $22 + $15 + $6 = $43"
      const lenMatch = invoiceText.match(/Len:\s*[^=]*=\s*\$(\d+)/i);
      const selMatch = invoiceText.match(/Sel:\s*[^=]*=\s*\$(\d+)/i);
      const danielMatch = invoiceText.match(/Daniel:\s*[^=]*=\s*\$(\d+)/i);
      const abiMatch = invoiceText.match(/Abi:\s*[^=]*=\s*\$(\d+)/i);
      
      lenInvoice = lenMatch ? parseFloat(lenMatch[1]) : 0;
      selInvoice = selMatch ? parseFloat(selMatch[1]) : 0;
      danielInvoice = danielMatch ? parseFloat(danielMatch[1]) : 0;
      abiInvoice = abiMatch ? parseFloat(abiMatch[1]) : 0;
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
      currentSheetName
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

