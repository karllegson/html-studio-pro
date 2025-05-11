import React, { useRef, useState, useEffect } from 'react';
import { uploadImage, deleteImage } from '@/utils/imageUpload';
import { useTaskContext } from '@/context/TaskContext';
import { TaskImage } from '@/types';
import { Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface PhotoUploadPreviewProps {
  companyName?: string;
  pageType?: string;
  taskId?: string;
  onImagesChange?: (images: PreviewImage[]) => void;
}

interface PreviewImage extends TaskImage {
  file?: File;
  uploading?: boolean;
  error?: string;
}

export const PhotoUploadPreview: React.FC<PhotoUploadPreviewProps> = ({
  companyName,
  pageType,
  taskId,
  onImagesChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentTask, updateTask } = useTaskContext();
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});

  // Load images from Firestore on mount/task change
  useEffect(() => {
    if (!taskId) return;
    const newImages = currentTask?.images || [];
    // Only update if the images have actually changed (compare by url+name)
    const isSame =
      images.length === newImages.length &&
      images.every((img, i) => img.url === newImages[i]?.url && img.name === newImages[i]?.name);
    if (!isSame) {
      setImages(newImages);
    }
  }, [taskId, currentTask?.images]);

  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(images);
    }
  }, [images, onImagesChange]);

  // Clean up object URLs for local previews
  useEffect(() => {
    return () => {
      images.forEach(img => img.file && URL.revokeObjectURL(img.url));
    };
  }, [images]);

  // Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !taskId) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    
    // Create new images array with uploading state
    const newImages: PreviewImage[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploading: true,
    }));

    // Update local state immediately
    setImages(prev => [...prev, ...newImages]);

    // Upload to Firebase in the background
    const updatedImages = [...images];
    await Promise.all(files.map(async (file, i) => {
      const path = `tasks/${taskId}`;
      try {
        // Add progress callback to uploadImage
        const result = await uploadImage(file, path, (progress: number) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });
        if (result.success && result.url) {
          const meta: TaskImage = {
            url: result.url,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          };
          updatedImages.push(meta);
          // Update local state with uploaded image
          setImages(prev => {
            const withoutUploading = prev.filter(img => img.file !== file);
            return [...withoutUploading, meta];
          });
          setUploadProgress(prev => {
            const copy = { ...prev };
            delete copy[file.name];
            return copy;
          });
        } else {
          setImages(prev => prev.map(img =>
            img.file === file ? { ...img, uploading: false, error: result.error || 'Upload failed' } : img
          ));
        }
      } catch (error) {
        setImages(prev => prev.map(img =>
          img.file === file ? { ...img, uploading: false, error: 'Upload failed' } : img
        ));
      }
    }));

    // Update Firebase once all uploads are complete
    await updateTask(taskId, { images: updatedImages });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Remove handler
  const handleRemove = async (idx: number) => {
    if (!taskId) return;
    const imgToRemove = images[idx];
    if (!imgToRemove.url) return;

    // Update local state immediately
    const updatedImages = images.filter((img, i) => i !== idx);
    setImages(updatedImages);

    // Update Firebase in the background
    await deleteImage(imgToRemove.url);
    await updateTask(taskId, { images: updatedImages });
  };

  // Download all handler
  const handleDownloadAll = async () => {
    if (!images.length) return;

    try {
      for (const image of images) {
        // Fetch the image first
        const response = await fetch(image.url);
        const blob = await response.blob();
        
        // Create a download link
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = image.name;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "Downloads started",
        description: "Your images are being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading images:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your images.",
        variant: "destructive",
      });
    }
  };

  const handleCopyFilename = (filename: string) => {
    // Remove file extension
    const filenameWithoutExtension = filename.replace(/\.[^/.]+$/, '');
    navigator.clipboard.writeText(filenameWithoutExtension);
    toast({
      title: 'Copied to clipboard',
      description: 'Filename has been copied.',
      duration: 2000,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Image previews */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 place-items-center auto-rows-[120px] md:auto-rows-[140px] justify-center">
        {images.map((img, idx) => (
          <div key={img.url + '-' + idx} className="relative w-[140px] h-[105px] md:w-[160px] md:h-[120px] aspect-[4/3] rounded-lg overflow-hidden bg-muted border-2 border-gray-300 hover:border-blue-500 transition-colors flex-shrink-0 flex items-center justify-center">
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
              onClick={() => setPreviewIdx(idx)}
              draggable={false}
              loading="lazy"
            />
            {img.uploading && (
              <>
                {/* Subtle overlay only if you want, or remove for just the bar */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white pointer-events-none select-none">
                  <div className="text-xs">Uploading...</div>
                </div>
                {/* Progress bar at the bottom, not overlapping image or buttons */}
                <div className="absolute left-0 right-0 bottom-0 px-2 pb-2 z-10">
                  <Progress value={uploadProgress[img.name] || 0} className="h-2" />
                  <div className="text-xs text-center mt-1 text-white drop-shadow-sm">{uploadProgress[img.name] ? `${uploadProgress[img.name]}%` : ''}</div>
                </div>
              </>
            )}
            {img.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-700/80 text-white text-xs p-2">{img.error}</div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 rounded-full p-1 text-white shadow"
                onClick={() => handleCopyFilename(img.name)}
                title="Copy filename"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 rounded-full p-1 text-white shadow"
                onClick={() => handleRemove(idx)}
                title="Remove image"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Hidden input for file upload */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      {/* Modal preview */}
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
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 