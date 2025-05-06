import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, X, Eye, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { uploadImage, deleteImage } from '@/utils/imageUpload';
import { useTaskContext } from '@/context/TaskContext';
import { TaskImage } from '@/types';

interface PreviewImage extends TaskImage {
  file?: File;
  uploading?: boolean;
  error?: string;
}

interface PhotoUploadPreviewProps {
  companyName?: string;
  pageType?: string;
  taskId?: string;
}

export const PhotoUploadPreview: React.FC<PhotoUploadPreviewProps> = ({ companyName, pageType, taskId }) => {
  const { currentTask, updateTask } = useTaskContext();
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to reload images from Firestore
  const reloadImagesFromFirestore = useCallback(async () => {
    if (!taskId) return;
    
    try {
      const taskImages = currentTask?.images || [];
      setImages(taskImages.map(img => ({ ...img, uploading: false })));
    } catch (error) {
      console.error('Error reloading images:', error);
    }
  }, [taskId, currentTask?.images]);

  // Load images from Firestore when task changes
  useEffect(() => {
    reloadImagesFromFirestore();
  }, [reloadImagesFromFirestore]);

  // Cleanup object URLs on unmount or when images change
  useEffect(() => {
    return () => {
      images.forEach(img => img.file && URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !taskId) return;

    const files = Array.from(e.target.files);
    const newImages: PreviewImage[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploading: true
    }));

    setImages(prev => [...prev, ...newImages]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const idx = images.length + i;
      const path = `tasks/${taskId}`;

      try {
        const result = await uploadImage(file, path);
        if (result.success && result.url) {
          const uploadedAt = new Date().toISOString();
          const meta: TaskImage = {
            url: result.url,
            name: file.name,
            size: file.size,
            uploadedAt
          };

          setImages(prev => prev.map((img, j) => 
            j === idx ? { ...img, ...meta, uploading: false } : img
          ));

          // Update Firestore with new image
          const updatedImages = [...(currentTask?.images || []), meta];
          await updateTask(taskId, { images: updatedImages });
          await reloadImagesFromFirestore();
        } else {
          setImages(prev => prev.map((img, j) => 
            j === idx ? { ...img, uploading: false, error: result.error } : img
          ));
        }
      } catch (error) {
        setImages(prev => prev.map((img, j) => 
          j === idx ? { ...img, uploading: false, error: 'Upload failed' } : img
        ));
      }
    }
  };

  const handleRemove = async (idx: number) => {
    if (!taskId) return;

    const imgToRemove = images[idx];
    setImages(prev => {
      if (imgToRemove.file) URL.revokeObjectURL(imgToRemove.url);
      return prev.filter((_, i) => i !== idx);
    });

    try {
      // Remove from Storage
      await deleteImage(imgToRemove.url);

      // Update Firestore
      const updatedImages = (currentTask?.images || []).filter(
        img => !(img.url === imgToRemove.url && img.name === imgToRemove.name)
      );
      await updateTask(taskId, { images: updatedImages });
      await reloadImagesFromFirestore();
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!taskId) return;

    try {
      // Delete all images from Storage
      await Promise.all(images.map(img => deleteImage(img.url)));

      // Clear local state
      images.forEach(img => img.file && URL.revokeObjectURL(img.url));
      setImages([]);
      setShowDeleteDialog(false);

      // Update Firestore
      await updateTask(taskId, { images: [] });
      await reloadImagesFromFirestore();
    } catch (error) {
      console.error('Error deleting all images:', error);
    }
  };

  const getZipFileName = () => {
    const parts = [
      companyName?.replace(/\s+/g, '-'),
      pageType?.replace(/\s+/g, '-')
    ].filter(Boolean);
    return (parts.length ? parts.join('-') : 'photos') + '-photos.zip';
  };

  const handleDownloadAll = async () => {
    if (!images.length) return;

    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      await Promise.all(images.map(async img => {
        const response = await fetch(img.url);
        const blob = await response.blob();
        zip.file(img.name, blob);
      }));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getZipFileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      console.error('Error downloading images:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-[320px]">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="default" onClick={() => inputRef.current?.click()}>
          <Upload size={16} className="mr-2" /> Upload Photos
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">{images.length}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 flex-1 min-h-0 max-h-56 overflow-y-auto">
        {images.map((img, idx) => (
          <div key={img.url + '-' + img.name} className="relative w-full aspect-square rounded overflow-hidden bg-muted flex items-center justify-center">
            <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
            {img.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
            {img.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-700/80 text-white text-xs p-2">
                {img.error}
              </div>
            )}
            <button
              type="button"
              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-1 text-white shadow"
              onClick={() => handleRemove(idx)}
              title="Remove image"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-black/70 hover:bg-black/90 rounded-full p-1 text-white shadow"
              onClick={() => setPreviewIdx(idx)}
              title="Preview image"
            >
              <Eye size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          onClick={handleDownloadAll}
          disabled={!images.length || downloading}
          className="w-4/5 flex items-center justify-center"
        >
          {downloading ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <Download size={16} className="mr-2" />
          )}
          Download All Photos
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all photos?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All uploaded photos will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewIdx !== null && images[previewIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewIdx(null)}
        >
          <div
            className="relative max-w-2xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[previewIdx].url}
              alt={images[previewIdx].name}
              className="max-h-[80vh] rounded shadow-lg"
            />
            <div className="mt-2 text-white text-sm">{images[previewIdx].name}</div>
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-2 text-white shadow"
              onClick={() => setPreviewIdx(null)}
              title="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 