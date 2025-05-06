
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface ImageConverterProps {
  onCopyToClipboard: (text: string) => void;
}

export const ImageConverter: React.FC<ImageConverterProps> = ({
  onCopyToClipboard,
}) => {
  const [imageFileName, setImageFileName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const convertImageFileName = () => {
    if (!imageFileName) return;
    
    const baseUrl = "https://cdn.yoursite.com/images/";
    setImageUrl(`${baseUrl}${imageFileName}`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-2">Image File Link Converter</h3>
        <div className="space-y-2">
          <Input
            placeholder="Enter image filename"
            value={imageFileName}
            onChange={(e) => setImageFileName(e.target.value)}
          />
          <Button onClick={convertImageFileName} className="w-full">
            Convert
          </Button>
          {imageUrl && (
            <div className="mt-2">
              <Label>Full Image URL:</Label>
              <div className="flex gap-2">
                <Input 
                  value={imageUrl} 
                  readOnly 
                  className="font-mono text-xs mt-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onCopyToClipboard(imageUrl)}
                  className="flex-shrink-0 mt-1"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
