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
 * IMAGE ALT TEXT
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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for field markers
    if (line === 'IMAGE URL') {
      // Save previous image if it exists
      if (Object.keys(currentImage).length > 0) {
        images.push({ ...currentImage, order } as ParsedImageInfo);
        order++;
        currentImage = {};
      }
      lastField = 'imageUrl';
      continue;
    }
    
    if (line === 'IMAGE FILE NAME') {
      lastField = 'fileName';
      continue;
    }
    
    if (line === 'IMAGE (SEARCH) TITLE' || line === 'IMAGE SEARCH TITLE') {
      lastField = 'searchTitle';
      continue;
    }
    
    if (line === 'IMAGE ALT TEXT') {
      lastField = 'altText';
      continue;
    }
    
    // If we have a field marker set, the next non-empty line is the value
    if (lastField && line.length > 0) {
      currentImage[lastField] = line;
      lastField = null;
    }
  }
  
  // Save the last image if it exists
  if (Object.keys(currentImage).length > 0) {
    images.push({ ...currentImage, order } as ParsedImageInfo);
  }
  
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

