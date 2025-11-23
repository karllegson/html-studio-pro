/**
 * Replaces all img src URLs in HTML with numbered placeholders
 * Example: <img src="https://..." alt="text"> becomes <img src="1" alt="text">
 * 
 * @param htmlContent - The HTML code to process
 * @returns Object with numbered HTML and array of original URLs in order
 */
export function numberImageSources(htmlContent: string): {
  numberedHtml: string;
  imageUrls: string[];
} {
  const imageUrls: string[] = [];
  let counter = 1;
  
  // Match all img tags with src attributes
  const numberedHtml = htmlContent.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, srcUrl, after) => {
      imageUrls.push(srcUrl);
      const numbered = `<img${before}src="${counter}"${after}>`;
      counter++;
      return numbered;
    }
  );
  
  return {
    numberedHtml,
    imageUrls
  };
}

/**
 * Extracts image numbers from img src attributes in HTML
 * Returns array of numbers in the order they appear
 * Supports both src="1" and src="[1]" formats
 * 
 * @param htmlContent - The HTML code to parse
 * @returns Array of image numbers (e.g., [1, 2, 3])
 */
export function extractImageNumbers(htmlContent: string): number[] {
  const numbers: number[] = [];
  
  // Match all img tags with numeric src attributes (with or without brackets)
  // Matches: src="1", src="[1]", src='2', src='[2]'
  const imgTagRegex = /<img[^>]*src=["']\[?(\d+)\]?["'][^>]*>/gi;
  let match;
  
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) {
      numbers.push(num);
    }
  }
  
  return numbers;
}


