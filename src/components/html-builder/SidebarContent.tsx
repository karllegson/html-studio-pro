import React, { useRef, useState } from 'react';
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
  sidebarWidth?: number;
  setSidebarWidth?: (width: number) => void;
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
  sidebarWidth = 260,
  setSidebarWidth,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const startResize = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
  };

  React.useEffect(() => {
    if (!setSidebarWidth) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return;
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      setSidebarWidth(Math.max(180, Math.min(newWidth, 500)));
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setSidebarWidth]);

  if (onlyTagsAndComponents) {
    return (
      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth, minWidth: 180, maxWidth: 500, position: 'relative', transition: 'width 0.2s' }}
        className="h-full bg-card border-r border-border flex flex-col"
      >
        <div
          onMouseDown={startResize}
          style={{ position: 'absolute', right: 0, top: 0, width: 8, height: '100%', cursor: 'ew-resize', zIndex: 10 }}
          className="bg-transparent hover:bg-primary/20 transition-colors"
          title="Drag to resize sidebar"
        />
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
