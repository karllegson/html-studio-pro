
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TagButtonProps {
  label: string;
  openTag: string;
  closeTag: string | null;
  onTagClick: (openTag: string, closeTag: string | null) => void;
  className?: string;
}

export const TagButton: React.FC<TagButtonProps> = ({
  label,
  openTag,
  closeTag,
  onTagClick,
  className
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    onTagClick(isOpen ? openTag : (closeTag || ''), isOpen ? closeTag : null);
    
    // Only toggle the button state if no text is selected and it has a closing tag
    if (closeTag && window.getSelection()?.toString() === '') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'tag-button whitespace-nowrap text-sm',
        isOpen ? '' : 'bg-secondary',
        className
      )}
      onClick={handleClick}
    >
      {isOpen ? label : `/${label}`}
    </Button>
  );
};
