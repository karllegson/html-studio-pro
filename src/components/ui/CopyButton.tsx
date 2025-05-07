import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  className?: string;
  disabled?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, className = '', disabled = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (disabled) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      type="button"
      className={`border border-border rounded-md px-2 py-1 flex items-center justify-center transition-colors duration-200
        bg-background hover:bg-muted
        ${copied ? 'bg-green-500 text-white border-green-600' : 'text-foreground'}
        ${className}
      `}
      style={{ minWidth: 32, minHeight: 32 }}
      onClick={handleCopy}
      disabled={disabled}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

export default CopyButton; 