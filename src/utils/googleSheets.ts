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
  previousPeriod: number; // From previous sheet (pending payment)
  invoiceTotal: number; // From invoice summary
  extra: number; // Bonuses/extras
}

export interface EarningsData {
  earnings: PersonEarnings[];
  currentSheetName: string;
  previousSheetName: string;
}

/**
 * Fetch earnings data from Google Sheets
 * Reads current period from current sheet and previous period from previous sheet
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
    const currentRange = `${currentSheetName}!L5:O7`;
    const currentUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${currentRange}?key=${API_KEY}`;
    const currentResponse = await fetch(currentUrl);
    
    if (!currentResponse.ok) {
      console.error('Failed to fetch current earnings');
      return null;
    }

    const currentData = await currentResponse.json();
    const currentRows = currentData.values || [];

    // Parse current period earnings (row 1 = row 5 in sheet)
    const lenCurrent = parseFloat(currentRows[0]?.[0]?.replace('$', '') || '0');
    const selCurrent = parseFloat(currentRows[0]?.[1]?.replace('$', '') || '0');
    const danielCurrent = parseFloat(currentRows[0]?.[2]?.replace('$', '') || '0');
    const abiCurrent = parseFloat(currentRows[0]?.[3]?.replace('$', '') || '0');

    // Parse extras from row 7 (row 3 in our range)
    const extraText = currentRows[2]?.[1] || ''; // "Sel: $30 (from last"
    const extraMatch = extraText.match(/\$(\d+)/);
    const selExtra = extraMatch ? parseFloat(extraMatch[1]) : 0;

    // Calculate previous sheet name (e.g., "Posting 022" -> "Posting 021")
    const previousSheetName = getPreviousSheetName(currentSheetName);
    
    // Fetch previous period earnings (pending payment)
    let lenPrevious = 0, selPrevious = 0, danielPrevious = 0, abiPrevious = 0;
    
    if (previousSheetName) {
      const previousRange = `${previousSheetName}!L5:O5`;
      const previousUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${previousRange}?key=${API_KEY}`;
      const previousResponse = await fetch(previousUrl);
      
      if (previousResponse.ok) {
        const previousData = await previousResponse.json();
        const previousRows = previousData.values || [];
        lenPrevious = parseFloat(previousRows[0]?.[0]?.replace('$', '') || '0');
        selPrevious = parseFloat(previousRows[0]?.[1]?.replace('$', '') || '0');
        danielPrevious = parseFloat(previousRows[0]?.[2]?.replace('$', '') || '0');
        abiPrevious = parseFloat(previousRows[0]?.[3]?.replace('$', '') || '0');
      }
    }

    // TODO: Fetch invoice summary from row 96 if needed
    // For now, we'll use the current + previous as totals

    return {
      earnings: [
        {
          name: 'Len',
          currentPeriod: lenCurrent,
          previousPeriod: lenPrevious,
          invoiceTotal: lenCurrent + lenPrevious,
          extra: 0
        },
        {
          name: 'Sel',
          currentPeriod: selCurrent,
          previousPeriod: selPrevious + selExtra,
          invoiceTotal: selCurrent + selPrevious + selExtra,
          extra: selExtra
        },
        {
          name: 'Daniel',
          currentPeriod: danielCurrent,
          previousPeriod: danielPrevious,
          invoiceTotal: danielCurrent + danielPrevious,
          extra: 0
        },
        {
          name: 'Abi',
          currentPeriod: abiCurrent,
          previousPeriod: abiPrevious,
          invoiceTotal: abiCurrent + abiPrevious,
          extra: 0
        }
      ],
      currentSheetName,
      previousSheetName: previousSheetName || ''
    };
  } catch (error) {
    console.error('Error fetching earnings data:', error);
    return null;
  }
}

/**
 * Calculate previous sheet name from current sheet name
 * e.g., "Posting 022" -> "Posting 021"
 */
function getPreviousSheetName(currentName: string): string | null {
  const match = currentName.match(/(.+\s)(\d+)$/);
  if (match) {
    const prefix = match[1]; // "Posting "
    const number = parseInt(match[2]); // 22
    const previousNumber = number - 1;
    return `${prefix}${previousNumber.toString().padStart(match[2].length, '0')}`;
  }
  return null;
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

