import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { TaskImage } from '@/types';

/**
 * Maximum file size in bytes (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/tif'];

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
    return 'Invalid file type. Only JPEG, PNG, GIF, WebP, and TIFF images are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 50MB.';
  }
  return undefined;
};

/**
 * Uploads an image to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path to upload to
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to the upload result
 */
export const uploadImage = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  console.log('[uploadImage] called', { file, path });
  try {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      console.log('[uploadImage] validation error', validationError);
      return { success: false, error: validationError };
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = `${path}/${filename}`;

    // Upload file with progress
    const storageRef = ref(storage, fullPath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise<UploadResult>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(percent);
          }
        },
        (error) => {
          console.error('[uploadImage] error', error);
          resolve({ success: false, error: error instanceof Error ? error.message : 'Failed to upload image' });
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            // Create image metadata
            const imageData: TaskImage = {
              url,
              name: file.name,
              size: file.size,
              uploadedAt: new Date().toISOString()
            };

            console.log('[uploadImage] success', imageData);
            resolve({ success: true, url: imageData.url });
          } catch (error) {
            resolve({ success: false, error: error instanceof Error ? error.message : 'Failed to get download URL' });
          }
        }
      );
    });
  } catch (error) {
    console.error('[uploadImage] error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
};

/**
 * Extracts the storage path from a Firebase Storage download URL
 * @param url - The download URL
 * @returns The storage path
 */
const getStoragePathFromUrl = (url: string): string | null => {
  try {
    // Example: https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/tasks%2FtaskId%2Ffilename.jpg?alt=media&token=...
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

/**
 * Deletes an image from Firebase Storage
 * @param url - The URL of the image to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
export const deleteImage = async (url: string): Promise<boolean> => {
  try {
    const storagePath = getStoragePathFromUrl(url);
    if (!storagePath) throw new Error('Invalid storage URL');
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}; 