/**
 * Utility for parsing image metadata from Google Doc content
 */

export interface ParsedImageInfo {
  imageUrl?: string;
  fileName?: string;
  searchTitle?: string;
  altText?: string;
  order: number; // 1-based: 1 = featured, 2 = src="1", 3 = src="2", etc.
}

/**
 * Parses Google Doc content to extract image metadata blocks
 * 
 * Expected format:
 * IMAGE URL
 * [filename].jpg
 * 
 * IMAGE FILE NAME
 * [filename-without-extension]
 * 
 * IMAGE (SEARCH) TITLE
 * [Full title text]
 * 
 * IMAGE ALT TEXT (or IMAGE DESCRIPTION)
 * [Alt text description]
 * 
 * @param content - Raw text pasted from Google Doc
 * @returns Array of parsed image metadata, ordered as they appear
 */
export function parseImageInfoFromGoogleDoc(content: string): ParsedImageInfo[] {
  const images: ParsedImageInfo[] = [];
  
  // Split content into lines and clean up
  const lines = content.split('\n').map(line => line.trim());
  
  let currentImage: Partial<ParsedImageInfo> = {};
  let lastField: 'imageUrl' | 'fileName' | 'searchTitle' | 'altText' | null = null;
  let order = 1;
  
  console.log('Parsing Google Doc content, total lines:', lines.length);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Skip empty lines
    if (line.length === 0) continue;
    
    // Check for field markers (case-insensitive, flexible matching)
    if (upperLine.includes('IMAGE URL') || upperLine === 'IMAGE URL') {
      // Save previous image if it exists
      if (Object.keys(currentImage).length > 0) {
        console.log(`Saving image ${order}:`, currentImage);
        images.push({ ...currentImage, order } as ParsedImageInfo);
        order++;
        currentImage = {};
      }
      lastField = 'imageUrl';
      console.log('Found IMAGE URL marker');
      continue;
    }
    
    if (upperLine.includes('IMAGE FILE NAME') || upperLine === 'IMAGE FILE NAME') {
      lastField = 'fileName';
      console.log('Found IMAGE FILE NAME marker');
      continue;
    }
    
    if (upperLine.includes('IMAGE') && (upperLine.includes('SEARCH') || upperLine.includes('TITLE'))) {
      lastField = 'searchTitle';
      console.log('Found IMAGE TITLE marker');
      continue;
    }
    
    if (upperLine.includes('IMAGE ALT') || upperLine === 'IMAGE ALT TEXT' || upperLine.includes('IMAGE DESCRIPTION')) {
      lastField = 'altText';
      console.log('Found IMAGE ALT TEXT / DESCRIPTION marker');
      continue;
    }
    
    // If we have a field marker set, the next non-empty line is the value
    if (lastField && line.length > 0) {
      currentImage[lastField] = line;
      console.log(`Set ${lastField} to:`, line);
      lastField = null;
    }
  }
  
  // Save the last image if it exists
  if (Object.keys(currentImage).length > 0) {
    console.log(`Saving final image ${order}:`, currentImage);
    images.push({ ...currentImage, order } as ParsedImageInfo);
  }
  
  console.log('Total images parsed:', images.length);
  
  return images;
}

/**
 * Normalizes a string for fuzzy matching
 * Removes special characters, converts to lowercase
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

