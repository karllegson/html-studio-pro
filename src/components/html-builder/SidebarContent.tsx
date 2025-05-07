import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TagsSection } from './TagsSection';
import { CompanySection } from './CompanySection';
import { ImageConverter } from './ImageConverter';
import { CompanyTemplateList } from './CompanyTemplateSection';

interface SidebarContentProps {
  companyId: string;
  contactLink: string;
  notes: string;
  pageType: string;
  onTagClick: (openTag: string, closeTag: string | null) => void;
  onInsertComponent: (html: string) => void;
  onCompanyChange: (value: string) => void;
  onContactLinkChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPageTypeChange: (value: string) => void;
  onlyTagsAndComponents?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  companyId,
  contactLink,
  notes,
  pageType,
  onTagClick,
  onInsertComponent,
  onCompanyChange,
  onContactLinkChange,
  onNotesChange,
  onPageTypeChange,
  onlyTagsAndComponents = false,
}) => {
  if (onlyTagsAndComponents) {
    return (
      <div className="h-full">
        <TagsSection onTagClick={onTagClick} onInsertComponent={onInsertComponent} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Static sections - always visible */}
      <div className="space-y-4 pr-4 mb-4">
        <CompanySection
          companyId={companyId}
          contactLink={contactLink}
          pageType={pageType}
          onCompanyChange={onCompanyChange}
          onContactLinkChange={onContactLinkChange}
          onPageTypeChange={onPageTypeChange}
        />
        <CompanyTemplateList
          companyId={companyId}
          pageType={pageType}
          onInsertTemplate={onInsertComponent}
        />
        <ImageConverter />
      </div>
      {/* Scrollable Tags section - stays in view when scrolling */}
      <div className="flex-1 overflow-hidden">
        <div className="sticky top-0 pr-4 max-h-full overflow-auto">
          <TagsSection onTagClick={onTagClick} onInsertComponent={onInsertComponent} />
        </div>
      </div>
    </div>
  );
};
