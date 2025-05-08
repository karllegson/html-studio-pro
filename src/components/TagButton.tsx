import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TagButtonProps {
  label: string;
  openTag: string;
  closeTag: string | null;
  onTagClick: (openTag: string, closeTag: string | null) => void;
  className?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const TagButton: React.FC<TagButtonProps> = ({
  label,
  openTag,
  closeTag,
  onTagClick,
  className,
  isOpen,
  setIsOpen
}) => {
  const handleClick = () => {
    if (!closeTag) {
      // Always insert openTag for self-closing tags
      onTagClick(openTag, null);
      return;
    }
    
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    
    if (hasSelection) {
      // If there's a selection, always wrap it with both tags
      onTagClick(openTag, closeTag);
    } else {
      // If no selection, insert either opening or closing tag based on state
      if (isOpen) {
        onTagClick(openTag, null);
      } else {
        onTagClick(closeTag, null);
      }
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
      {/* Only show /label if closeTag exists */}
      {closeTag ? (isOpen ? label : `/${label}`) : label}
    </Button>
  );
};
