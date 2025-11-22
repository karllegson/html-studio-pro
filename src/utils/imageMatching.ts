/**
 * Utility for matching parsed Google Doc image metadata with uploaded photos
 */

import { TaskImage } from '@/types';
import { ParsedImageInfo, normalizeString } from './googleDocParser';

export interface ImageMetadataMapping {
  imageIndex: number; // Index in the images array
  metadata: ParsedImageInfo;
  matchType: 'filename' | 'order' | 'featured';
}

/**
 * Extracts src numbers from HTML content (existing functionality)
 * Returns array of numbers from img tags like <img src="1">, <img src="2">
 */
export function extractImageSrcNumbersFromHtml(htmlContent: string): number[] {
  const srcNumbers: number[] = [];
  const imgTagRegex = /<img[^>]*src=["'](\d+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    srcNumbers.push(parseInt(match[1], 10));
  }
  
  return srcNumbers;
}

/**
 * Smart matching algorithm that uses both HTML src numbers and Google Doc order
 * 
 * Logic:
 * 1. First parsed image (order=1) → Featured image
 * 2. Second parsed image (order=2) → HTML src="1" → Match by filename to uploaded images
 * 3. Third parsed image (order=3) → HTML src="2" → Match by filename
 * 4. For images without HTML src, match by remaining order
 * 
 * @param images - Array of uploaded images
 * @param parsedInfo - Array of parsed image metadata from Google Doc
 * @param htmlContent - HTML content with src numbers
 * @returns Array of mappings showing which metadata applies to which image
 */
export function matchImageMetadata(
  images: TaskImage[],
  parsedInfo: ParsedImageInfo[],
  htmlContent: string
): ImageMetadataMapping[] {
  const mappings: ImageMetadataMapping[] = [];
  
  if (parsedInfo.length === 0) {
    return mappings;
  }
  
  // Extract src numbers from HTML
  const srcNumbers = extractImageSrcNumbersFromHtml(htmlContent);
  
  const usedImageIndices = new Set<number>();
  const usedParsedIndices = new Set<number>();
  
  // Step 1: Handle featured image (first parsed image, order=1)
  if (parsedInfo.length > 0 && images.length > 0) {
    const featuredMetadata = parsedInfo[0]; // order=1
    
    // Try to match by filename first
    let featuredImageIndex = -1;
    
    for (let i = 0; i < images.length; i++) {
      if (usedImageIndices.has(i)) continue;
      
      const normalizedImageName = normalizeString(images[i].name);
      const normalizedFileName = featuredMetadata.fileName 
        ? normalizeString(featuredMetadata.fileName)
        : '';
      
      if (normalizedFileName && normalizedImageName.includes(normalizedFileName)) {
        featuredImageIndex = i;
        break;
      }
    }
    
    // If no filename match, use first uploaded image
    if (featuredImageIndex === -1) {
      featuredImageIndex = 0;
    }
    
    mappings.push({
      imageIndex: featuredImageIndex,
      metadata: featuredMetadata,
      matchType: 'featured'
    });
    
    usedImageIndices.add(featuredImageIndex);
    usedParsedIndices.add(0);
  }
  
  // Step 2: Match HTML src numbers with parsed images
  // Remember: HTML src="1" corresponds to parsed image order=2 (because order=1 is featured)
  srcNumbers.forEach((srcNum, srcIndex) => {
    const parsedIndex = srcNum; // src="1" → parsed[1] (order=2), src="2" → parsed[2] (order=3)
    
    if (parsedIndex >= parsedInfo.length) {
      return; // No corresponding parsed metadata
    }
    
    const metadata = parsedInfo[parsedIndex];
    
    // Try to match by filename
    let matchedImageIndex = -1;
    
    for (let i = 0; i < images.length; i++) {
      if (usedImageIndices.has(i)) continue;
      
      const normalizedImageName = normalizeString(images[i].name);
      const normalizedFileName = metadata.fileName 
        ? normalizeString(metadata.fileName)
        : '';
      
      if (normalizedFileName && normalizedImageName.includes(normalizedFileName)) {
        matchedImageIndex = i;
        break;
      }
    }
    
    // If no filename match, use order-based matching
    if (matchedImageIndex === -1) {
      // Find the next unused image
      for (let i = 0; i < images.length; i++) {
        if (!usedImageIndices.has(i)) {
          matchedImageIndex = i;
          break;
        }
      }
    }
    
    if (matchedImageIndex !== -1) {
      mappings.push({
        imageIndex: matchedImageIndex,
        metadata,
        matchType: 'filename'
      });
      
      usedImageIndices.add(matchedImageIndex);
      usedParsedIndices.add(parsedIndex);
    }
  });
  
  // Step 3: Handle remaining parsed metadata (no HTML src or additional images) - match by order
  for (let i = 1; i < parsedInfo.length; i++) { // Start from 1 (skip featured at index 0)
    if (usedParsedIndices.has(i)) continue;
    
    const metadata = parsedInfo[i];
    
    // Try filename matching first
    let matchedImageIndex = -1;
    
    for (let j = 0; j < images.length; j++) {
      if (usedImageIndices.has(j)) continue;
      
      const normalizedImageName = normalizeString(images[j].name);
      const normalizedFileName = metadata.fileName 
        ? normalizeString(metadata.fileName)
        : '';
      
      if (normalizedFileName && normalizedImageName.includes(normalizedFileName)) {
        matchedImageIndex = j;
        console.log(`Matched parsed image ${i} by filename to uploaded image ${j}`);
        break;
      }
    }
    
    // If no filename match, use sequential order
    if (matchedImageIndex === -1) {
      for (let j = 0; j < images.length; j++) {
        if (!usedImageIndices.has(j)) {
          matchedImageIndex = j;
          console.log(`Matched parsed image ${i} by order to uploaded image ${j}`);
          break;
        }
      }
    }
    
    if (matchedImageIndex !== -1) {
      mappings.push({
        imageIndex: matchedImageIndex,
        metadata,
        matchType: 'order'
      });
      
      usedImageIndices.add(matchedImageIndex);
      usedParsedIndices.add(i);
    }
  }
  
  console.log('Final mappings:', mappings);
  
  return mappings;
}

