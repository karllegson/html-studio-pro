import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTaskContext } from '@/context/TaskContext';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageFilenameConverterProps {
  companyId: string;
  displayOutputAsText?: boolean;
}

export const ImageFilenameConverter: React.FC<ImageFilenameConverterProps> = ({ companyId, displayOutputAsText }) => {
  const [filename, setFilename] = useState('');
  const { getCompanyById } = useTaskContext();
  const { toast } = useToast();
  const arrowRef = useRef<HTMLDivElement>(null);
  const [lastLink, setLastLink] = useState('');
  const [arrowActive, setArrowActive] = useState(false);

  const selectedCompany = getCompanyById(companyId);

  const generateImageUrl = (filename: string) => {
    if (!selectedCompany) return '';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    return `${selectedCompany.basePath}${year}/${month}/${selectedCompany.prefix}${filename}${selectedCompany.fileSuffix}`;
  };

  const link = selectedCompany && filename ? generateImageUrl(filename) : '';

  const handleCopy = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      toast({
        title: "URL copied",
        description: "The image URL has been copied to your clipboard.",
      });
    }
  };

  // Animation: bounce and green arrow only when link changes
  React.useEffect(() => {
    if (!arrowRef.current) return;
    if (link && link !== lastLink) {
      setArrowActive(true);
      arrowRef.current.classList.remove('animate-bounce');
      void arrowRef.current.offsetWidth;
      arrowRef.current.classList.add('animate-bounce');
      setLastLink(link);
      const timeout = setTimeout(() => setArrowActive(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [link]);

  return (
    <Card className="p-4 rounded-lg bg-card border border-border">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="filename" className="mb-2">Image Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
              className="bg-muted text-white/90 border border-border"
            />
          </div>
          <div
            ref={arrowRef}
            className={`flex justify-center text-2xl select-none transition-all duration-300 ${arrowActive ? 'text-green-400 animate-bounce' : 'text-muted-foreground'}`}
          >
            ↓
          </div>
          {selectedCompany && filename && (
            displayOutputAsText ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs flex-1 break-all text-blue-400 bg-muted px-3 py-2 rounded select-all border border-border">
                  {link}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={link}
                  readOnly
                  className="font-mono text-xs flex-1 bg-muted text-blue-400 border border-border"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 