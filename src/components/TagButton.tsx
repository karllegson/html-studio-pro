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
    if (!closeTag) {
      // Always insert openTag for self-closing tags
      onTagClick(openTag, null);
      return;
    }
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    onTagClick(openTag, closeTag);
    if (!hasSelection) {
      setIsOpen(!isOpen);
    }
    // If there is a selection, do NOT toggle the state
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
