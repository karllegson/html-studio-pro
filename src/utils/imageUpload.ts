import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImage = async (file: File, path: string): Promise<UploadResult> => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `${path}/${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url: downloadURL
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}; 