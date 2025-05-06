import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { TaskImage } from '@/types';

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Result of an image upload operation
 */
interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validates a file before upload
 * @param file - The file to validate
 * @returns Error message if validation fails, undefined if valid
 */
const validateFile = (file: File): string | undefined => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 10MB.';
  }
  return undefined;
};

/**
 * Uploads an image to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path to upload to
 * @returns Promise resolving to the upload result
 */
export const uploadImage = async (file: File, path: string): Promise<UploadResult> => {
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = `${path}/${filename}`;

    // Upload file
    const storageRef = ref(storage, fullPath);
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    // Create image metadata
    const imageData: TaskImage = {
      url,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    return { success: true, url: imageData.url };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
};

/**
 * Deletes an image from Firebase Storage
 * @param url - The URL of the image to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
export const deleteImage = async (url: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}; 