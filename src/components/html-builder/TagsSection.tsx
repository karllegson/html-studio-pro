import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TagButton } from '@/components/TagButton';
import { ComponentButton } from '@/components/ComponentButton';
import { htmlTags, htmlComponents } from '@/data/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagsSectionProps {
  onTagClick: (openTag: string, closeTag: string | null) => void;
  onInsertComponent: (html: string) => void;
}

export const TagsSection: React.FC<TagsSectionProps> = ({ 
  onTagClick, 
  onInsertComponent 
}) => {
  return (
    <Card className="border-0 shadow-none h-full">
      <CardContent className="p-0 h-full">
        <ScrollArea className="h-full px-6 py-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">HTML Tags</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(htmlTags).map(([tag, [openTag, closeTag]]) => (
                  <TagButton 
                    key={tag}
                    label={tag}
                    openTag={openTag}
                    closeTag={closeTag}
                    onTagClick={onTagClick}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Components</h3>
              <div className="flex flex-wrap gap-2">
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
