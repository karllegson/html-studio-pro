import { TaskImage } from '@/types';
import { extractImageNumbers } from './imageNumbering';

/**
 * Normalizes a string for comparison by converting to lowercase and removing special characters
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts alt attributes from img tags in HTML content
 * Returns array of alt text values in the order they appear
 */
function extractAltTextsFromHtml(htmlContent: string): string[] {
  const altTexts: string[] = [];
  
  // Match all img tags and extract alt attributes
  // This regex matches: <img ...alt="value"... > or <img ...alt='value'... >
  const imgTagRegex = /<img[^>]*>/gi;
  const imgTags = htmlContent.match(imgTagRegex) || [];
  
  imgTags.forEach(tag => {
    // Extract alt attribute value (handles both single and double quotes)
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (altMatch && altMatch[1]) {
      altTexts.push(altMatch[1]);
    }
  });
  
  return altTexts;
}

/**
 * Sorts images to match the order they appear in HTML code
 * Now uses numbered img src (e.g., src="1", src="2") to determine order
 * Featured image is always placed at the bottom
 * 
 * @param htmlContent - The HTML code from the editor (with numbered img src)
 * @param images - Array of uploaded images
 * @param featuredImgUrl - URL of the featured image (will be placed at bottom)
 * @returns Sorted array with images in HTML number order, then featured image at bottom
 */
export function sortImagesByHtmlOrder(
  htmlContent: string,
  images: TaskImage[],
  featuredImgUrl?: string | null
): TaskImage[] {
  if (!htmlContent || !images.length) {
    return images;
  }
  
  // Separate featured image from other images
  let featuredImage: TaskImage | null = null;
  const nonFeaturedImages = images.filter(img => {
    if (featuredImgUrl && img.url === featuredImgUrl) {
      featuredImage = img;
      return false;
    }
    return true;
  });
  
  // Extract image numbers from HTML (e.g., [1, 2, 3, 5] if src="1", src="2", etc.)
  const imageNumbers = extractImageNumbers(htmlContent);
  
  if (!imageNumbers.length) {
    // If no numbered images found, fallback to alt text matching
    const altTexts = extractAltTextsFromHtml(htmlContent);
    
    if (!altTexts.length) {
      // If no alt texts either, return images with featured at bottom
      return featuredImage ? [...nonFeaturedImages, featuredImage] : images;
    }
    
    // Fallback to alt text matching
    const matchedImages: TaskImage[] = [];
    const unmatchedImages: TaskImage[] = [];
    const usedImageIndices = new Set<number>();
    
    altTexts.forEach(altText => {
      const normalizedAlt = normalizeString(altText);
      
      for (let i = 0; i < nonFeaturedImages.length; i++) {
        if (usedImageIndices.has(i)) continue;
        
        const image = nonFeaturedImages[i];
        const filenameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
        const normalizedFilename = normalizeString(filenameWithoutExt);
        
        if (normalizedFilename.includes(normalizedAlt) || normalizedAlt.includes(normalizedFilename)) {
          matchedImages.push(image);
          usedImageIndices.add(i);
          break;
        }
      }
    });
    
    nonFeaturedImages.forEach((image, index) => {
      if (!usedImageIndices.has(index)) {
        unmatchedImages.push(image);
      }
    });
    
    const sortedArray = [...matchedImages, ...unmatchedImages];
    return featuredImage ? [...sortedArray, featuredImage] : sortedArray;
  }
  
  // Use number-based ordering
  // Images are ordered by upload time, so image index corresponds to upload order
  // Map: imageNumber -> image from nonFeaturedImages array
  const sortedImages: TaskImage[] = [];
  const usedIndices = new Set<number>();
  
  // For each number in HTML order, add the corresponding image by index
  imageNumbers.forEach(num => {
    // num is 1-based (src="1", src="2", etc.)
    // Convert to 0-based index
    const index = num - 1;
    
    if (index >= 0 && index < nonFeaturedImages.length && !usedIndices.has(index)) {
      sortedImages.push(nonFeaturedImages[index]);
      usedIndices.add(index);
    }
  });
  
  // Add any remaining unmatched images
  nonFeaturedImages.forEach((image, index) => {
    if (!usedIndices.has(index)) {
      sortedImages.push(image);
    }
  });
  
  // Return sorted images with featured at the bottom
  return featuredImage ? [...sortedImages, featuredImage] : sortedImages;
}

