import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTaskContext } from '@/context/TaskContext';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageFilenameConverterProps {
  companyId: string;
}

export const ImageFilenameConverter: React.FC<ImageFilenameConverterProps> = ({ companyId }) => {
  const [filename, setFilename] = useState('');
  const { getCompanyById } = useTaskContext();
  const { toast } = useToast();

  const selectedCompany = getCompanyById(companyId);

  const generateImageUrl = (filename: string) => {
    if (!selectedCompany) return '';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    return `${selectedCompany.basePath}${year}/${month}/${selectedCompany.prefix}${filename}${selectedCompany.fileSuffix}`;
  };

  const handleCopy = async () => {
    const url = generateImageUrl(filename);
    if (url) {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL copied",
        description: "The image URL has been copied to your clipboard.",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Image Filename (without extension)</Label>
            <div className="flex gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename without extension"
              />
              <button
                onClick={handleCopy}
                className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          {selectedCompany && filename && (
            <div className="mt-4">
              <Label>Generated URL:</Label>
              <a
                href={generateImageUrl(filename)}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-sm text-blue-600 hover:underline break-all"
              >
                {generateImageUrl(filename)}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 