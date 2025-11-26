# Google Sheets Integration Setup

This guide will help you connect your Google Sheet to display task statistics on the homepage.

## Step 1: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. (Optional) Restrict the API key:
   - Click on the key name
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Save

## Step 3: Get Your Sheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Copy the SHEET_ID part

## Step 4: Make Sheet Public (Read-Only)

1. In your Google Sheet, click "Share"
2. Change "Restricted" to "Anyone with the link"
3. Set permission to "Viewer"

## Step 5: Configure Environment Variables

Add these to your `.env` file (create one if it doesn't exist):

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEETS_SHEET_ID=your_sheet_id_here
```

**Note:** You don't need to set `VITE_GOOGLE_SHEETS_RANGE` - the sheet name is configurable in the app UI!

## Step 6: Configure Sheet Name in App

1. On the homepage, you'll see a **gear icon (⚙️)** next to the Task Status widget
2. Click it to open the settings
3. Enter your current sheet name (e.g., "Posting 022", "Posting 023")
4. Click "Save & Reload"
5. The stats will refresh with data from that sheet

**Weekly Update:** When you create a new sheet (e.g., "Posting 023"), just click the gear icon and update the name. Takes 5 seconds!

## Step 7: Sheet Format

Your Google Sheet should have a status column (column D by default). The code will count:
- **Ready**: Rows with "ready" in the status column
- **In Progress**: Rows with "progress" or "in progress" in the status column  
- **Posted**: Rows with "post" or "live" in the status column

Example sheet structure:
```
| Task Name | Type | Date | Status | Notes |
|-----------|------|------|---------|-------|
| Task 1    | Blog | 1/1  | Ready   | ...   |
| Task 2    | Sub  | 1/2  | In Progress | ... |
| Task 3    | Land | 1/3  | Posted Live | ... |
```

## Step 8: Adjust Status Column (If Needed)

If your status is in a different column, edit `/src/utils/googleSheets.ts`:

```typescript
const status = row[3]?.toLowerCase() || ''; // Change 3 to your column index (0-based)
```

Column indexes:
- A = 0
- B = 1
- C = 2
- D = 3
- E = 4
- etc.

## Troubleshooting

### Stats Not Loading
1. Check browser console for errors
2. Verify API key is correct
3. Ensure sheet is publicly accessible
4. Check the sheet range matches your data

### Wrong Counts
1. Verify status column index in `googleSheets.ts`
2. Check your status text matches the keywords (ready, progress, post)
3. Open developer tools and check the API response

### API Quota Exceeded
- Free tier: 300 requests per minute
- Stats refresh every 5 minutes automatically
- Click refresh button sparingly

## Security Note

The API key is exposed in the client code. To keep it secure:
1. Restrict the API key to Google Sheets API only
2. Add HTTP referrer restrictions (your domain)
3. Make the sheet read-only for public access
4. Never use an API key with write permissions

