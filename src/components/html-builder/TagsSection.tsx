import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TagButton } from '@/components/TagButton';
import { ComponentButton } from '@/components/ComponentButton';
import { htmlTags, htmlComponents } from '@/data/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RotateCcw } from 'lucide-react';

interface TagsSectionProps {
  onTagClick: (openTag: string, closeTag: string | null) => void;
  onInsertComponent: (html: string) => void;
}

export const TagsSection: React.FC<TagsSectionProps> = ({ 
  onTagClick, 
  onInsertComponent 
}) => {
  // Track open/close state for each tag by key
  const tagKeys = Object.keys(htmlTags);
  const [openStates, setOpenStates] = useState(() => Object.fromEntries(tagKeys.map(key => [key, true])));

  const handleTagClick = (key: string, openTag: string, closeTag: string | null) => {
    onTagClick(openTag, closeTag);
    // Only toggle if not a self-closing tag and no selection
    if (closeTag) {
      setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleReset = () => {
    setOpenStates(Object.fromEntries(tagKeys.map(key => [key, true])));
  };

  return (
    <Card className="border-0 shadow-none h-full">
      <CardContent className="p-0 h-full">
        <ScrollArea className="h-full px-6 py-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-white/80 mr-2">HTML TAGS</h3>
                <button onClick={handleReset} className="p-1 hover:bg-secondary rounded transition-colors" title="Reset tag states">
                  <RotateCcw size={14} className="text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Object.entries(htmlTags).map(([tag, [openTag, closeTag]]) => (
                  <TagButton 
                    key={tag}
                    label={tag}
                    openTag={openTag}
                    closeTag={closeTag}
                    isOpen={openStates[tag]}
                    setIsOpen={isOpen => setOpenStates(prev => ({ ...prev, [tag]: isOpen }))}
                    onTagClick={(open, close) => handleTagClick(tag, open, close)}
                    className="text-sm px-3 py-1 rounded min-w-0 min-h-0 h-7"
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1 tracking-wide uppercase text-white/80">Components</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(htmlComponents).map(([name, template]) => (
                  <ComponentButton
                    key={name}
                    label={name}
                    template={template}
                    onInsert={onInsertComponent}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
