import React, { useRef, useState, useEffect } from 'react';
import { uploadImage, deleteImage } from '@/utils/imageUpload';
import { useTaskContext } from '@/context/TaskContext';
import { TaskImage } from '@/types';

interface PhotoUploadPreviewProps {
  companyName?: string;
  pageType?: string;
  taskId?: string;
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
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentTask, updateTask } = useTaskContext();
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

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
    // else do nothing to prevent jitter
  }, [taskId, currentTask?.images]);

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
    let updatedImages = currentTask?.images ? [...currentTask.images] : [];
    const newImages: PreviewImage[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploading: true,
    }));
    setImages(prev => [...updatedImages, ...newImages]);
    await Promise.all(files.map(async (file, i) => {
      const path = `tasks/${taskId}`;
      try {
        const result = await uploadImage(file, path);
        if (result.success && result.url) {
          const meta: TaskImage = {
            url: result.url,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          };
          updatedImages.push(meta);
          // Instantly update local preview
          setImages(prev => {
            // Remove the uploading preview for this file, add the uploaded image
            const withoutUploading = prev.filter(img => img.file !== file);
            return [...withoutUploading, meta];
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
    await updateTask(taskId, { images: updatedImages });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Remove handler
  const handleRemove = async (idx: number) => {
    if (!taskId) return;
    const imgToRemove = images[idx];
    if (!imgToRemove.url) return;
    await deleteImage(imgToRemove.url);
    const updatedImages = (currentTask?.images || []).filter(
      img => !(img.url === imgToRemove.url && img.name === imgToRemove.name)
    );
    await updateTask(taskId, { images: updatedImages });
    // Instantly update local preview
    setImages(prev => prev.filter((img, i) => i !== idx));
  };

  // Download all handler
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
      a.download = 'photos.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-muted h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Upload Photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-auto"
          onClick={handleDownloadAll}
          disabled={!images.length || downloading}
        >
          {downloading ? 'Downloading...' : 'Download All'}
        </button>
      </div>
      {/* Image previews */}
      <div className="grid grid-cols-2 gap-4 p-2 mb-2 overflow-auto">
        {images.map((img, idx) => (
          <div key={img.url + '-' + idx} className="relative rounded overflow-hidden bg-muted flex items-center justify-center w-[140px] h-[140px] mx-auto">
            <img
              src={img.url}
              alt={img.name}
              className="opacity-80 cursor-pointer w-[140px] h-[140px] object-cover"
              onClick={() => setPreviewIdx(idx)}
            />
            {img.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">Uploading...</div>
            )}
            {img.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-700/80 text-white text-xs p-2">{img.error}</div>
            )}
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 text-white shadow"
              onClick={() => handleRemove(idx)}
              title="Remove image"
            >
              ×
            </button>
          </div>
        ))}
      </div>
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