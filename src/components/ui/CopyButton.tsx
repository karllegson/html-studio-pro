import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  className?: string;
  disabled?: boolean;
  clickOrder?: number | null; // null = not clicked, number = order in which it was clicked
  onCopyClick?: () => void; // callback to track the click
  onResetClick?: () => void; // callback to reset/unclick
}

const CopyButton: React.FC<CopyButtonProps> = ({ 
  value, 
  className = '', 
  disabled = false,
  clickOrder = null,
  onCopyClick,
  onResetClick
}) => {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    // If already clicked (has a number), reset it
    if (clickOrder !== null && onResetClick) {
      onResetClick();
      return;
    }
    
    // Otherwise, copy and track
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    
    // Call the callback to track this button was clicked
    if (onCopyClick) {
      onCopyClick();
    }
  };

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (copied) return 'bg-purple-500 text-white border-purple-600';
    if (clickOrder !== null) return 'bg-purple-600 text-white border-purple-700';
    return 'bg-background hover:bg-muted text-foreground';
  };

  return (
    <button
      type="button"
      className={`border border-border rounded-md flex items-center justify-center transition-colors duration-200 flex-shrink-0
        ${getBackgroundColor()}
        ${className}
      `}
      style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px', padding: 0 }}
      onClick={handleClick}
      disabled={disabled}
      title={clickOrder !== null ? 'Click to reset' : 'Click to copy'}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : clickOrder !== null ? (
        <span className="font-bold text-sm">{clickOrder}</span>
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

export default CopyButton; 