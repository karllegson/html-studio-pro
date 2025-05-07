import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageFilenameConverterProps {
  companyDomain?: string;
}

const getCompanyDomain = (companyDomain?: string) => {
  if (!companyDomain) return 'example.com';
  // Remove protocol and trailing slashes if present
  return companyDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

export const ImageFilenameConverter: React.FC<ImageFilenameConverterProps> = ({ companyDomain }) => {
  const [filename, setFilename] = useState('');
  const [output, setOutput] = useState('');
  const { toast } = useToast();

  const handleConvert = () => {
    if (filename.trim()) {
      setOutput(`https://${getCompanyDomain(companyDomain)}/images/${filename.trim()}`);
    } else {
      setOutput('');
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast({
        title: 'Copied to clipboard',
        description: 'Image link has been copied.',
        duration: 2000,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-2">
        <Input
          type="text"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          className="font-mono text-xs flex-1 pl-3 rounded-md bg-card ml-2"
          placeholder="Enter image file name (e.g. photo.jpg)"
        />
        <Button variant="default" onClick={handleConvert} disabled={!filename.trim()}>
          Convert
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={output}
          readOnly
          className="w-full bg-card pl-3 rounded-md ml-2"
        />
        <Button variant="outline" size="icon" onClick={handleCopy} disabled={!output}>
          <Copy size={16} />
        </Button>
      </div>
    </div>
  );
}; 