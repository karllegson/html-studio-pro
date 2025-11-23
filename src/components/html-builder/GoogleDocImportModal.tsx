import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseImageInfoFromGoogleDoc, ParsedImageInfo } from '@/utils/googleDocParser';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleDocImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (parsedImages: ParsedImageInfo[]) => void;
  pastedContent: string;
  setPastedContent: (content: string) => void;
  parsedImages: ParsedImageInfo[];
  setParsedImages: (images: ParsedImageInfo[]) => void;
}

export function GoogleDocImportModal({ 
  open, 
  onOpenChange, 
  onApply,
  pastedContent,
  setPastedContent,
  parsedImages,
  setParsedImages
}: GoogleDocImportModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore preview state if we have parsed images
  React.useEffect(() => {
    if (parsedImages.length > 0) {
      setShowPreview(true);
    }
  }, [open, parsedImages]);

  const handleParse = () => {
    if (!pastedContent.trim()) {
      setError('Please paste content first');
      return;
    }

    try {
      const images = parseImageInfoFromGoogleDoc(pastedContent);
      
      if (images.length === 0) {
        setError('No image information found. Make sure you pasted the correct format.');
        setParsedImages([]);
        setShowPreview(false);
        return;
      }

      setParsedImages(images);
      setShowPreview(true);
      setError(null);
    } catch (err) {
      setError('Failed to parse content. Please check the format.');
      setParsedImages([]);
      setShowPreview(false);
    }
  };

  const handleApply = () => {
    if (parsedImages.length > 0) {
      onApply(parsedImages);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Image Information from Google Doc</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste Google Doc Content Below
            </label>
            <Textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste your Google Doc content here..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {showPreview && parsedImages.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">
                  Found {parsedImages.length} image{parsedImages.length !== 1 ? 's' : ''}
                </h3>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {parsedImages.map((img, index) => (
                  <div key={index} className="border rounded p-3 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 ? (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                          Featured Image
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Image {index + 1} (HTML src="{index}")
                        </span>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      {img.fileName && (
                        <div>
                          <span className="font-medium">Filename:</span> {img.fileName}
                        </div>
                      )}
                      {img.altText && (
                        <div>
                          <span className="font-medium">Alt:</span> {img.altText}
                        </div>
                      )}
                      {img.searchTitle && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Title:</span> {img.searchTitle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            {!showPreview ? (
              <Button
                onClick={handleParse}
                disabled={!pastedContent.trim()}
              >
                Parse Content
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={parsedImages.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply to Images
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

