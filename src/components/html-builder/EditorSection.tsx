import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Save, Maximize2, Plus, Minus, ArrowDown } from 'lucide-react';
import CopyButton from '@/components/ui/CopyButton';

export interface EditorSectionRef {
  getView: () => HTMLTextAreaElement | undefined;
}

interface EditorSectionProps {
  htmlContent: string;
  onHtmlChange: (value: string) => void;
  onUpdate: () => void;
  onSave: () => void;
  lastSavedAt?: Date | null;
}

export const EditorSection = forwardRef<EditorSectionRef, EditorSectionProps>(({
  htmlContent,
  onHtmlChange,
  onUpdate,
  onSave,
  lastSavedAt,
}, ref) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [isExtended, setIsExtended] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isVisible, setIsVisible] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();
  
  useImperativeHandle(ref, () => ({
    getView: () => editorRef.current
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current);
          }
          
          visibilityTimeoutRef.current = setTimeout(() => {
            setIsVisible(entry.isIntersecting);
          }, 150);
        });
      },
      { 
        threshold: [0, 0.1, 0.2],
        rootMargin: '50px 0px'
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 1, 24));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 1, 10));
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onHtmlChange(e.target.value);
    onUpdate();
  }, [onHtmlChange, onUpdate]);

  const scrollToBottom = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, []);

  const renderEditor = () => {
    if (!isVisible) {
      return (
        <div className="h-[500px] flex items-center justify-center text-muted-foreground">
          Editor is not visible
        </div>
      );
    }

    return (
      <textarea
        ref={editorRef}
        value={htmlContent}
        onChange={handleChange}
        className="w-full h-[500px] bg-[#282a36] text-[#f8f8f2] font-mono p-4 resize-none focus:outline-none"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: '1.5',
          tabSize: 2
        }}
        spellCheck={false}
      />
    );
  };

  const renderToolbar = () => (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsExtended(!isExtended)}
        aria-label={isExtended ? "Collapse editor" : "Expand editor"}
      >
        <Maximize2 size={14} />
      </Button>
      <div>HTML Editor</div>
      <div className="flex items-center gap-1 ml-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={decreaseFontSize}
          className="flex items-center gap-1"
        >
          <Minus size={14} />
        </Button>
        <span className="text-xs">{fontSize}px</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={increaseFontSize}
          className="flex items-center gap-1"
        >
          <Plus size={14} />
        </Button>
      </div>
      <CopyButton value={htmlContent} className="ml-2" />
      <Button 
        variant="outline" 
        size="sm"
        onClick={onSave}
        className="flex items-center gap-1"
      >
        <Save size={14} />
        Save
      </Button>
      <Button
        variant="ghost" 
        size="sm"
        onClick={scrollToBottom}
        className="flex items-center gap-1"
      >
        <ArrowDown size={14} />
        Scroll Bottom
      </Button>
    </div>
  );

  const editorContainer = (
    <div
      className={`bg-[#23263a] border border-border shadow-xl rounded-xl flex flex-col px-0 my-4 focus-within:ring-2 focus-within:ring-primary/60 transition-all duration-300 ${isExtended ? 'min-w-[1200px] w-[2000px] max-w-none' : 'w-full'}`}
    >
      <div className="p-2 bg-secondary text-secondary-foreground text-sm font-mono flex justify-between items-center rounded-t-xl">
        {renderToolbar()}
        {lastSavedAt && (
          <div className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
            Last saved: {lastSavedAt.toLocaleTimeString()}
          </div>
        )}
      </div>
      <div className="flex-1 rounded-b-xl overflow-hidden" style={{overflow: 'hidden', borderRadius: '0 0 1rem 1rem'}}>
        <div className="w-full max-w-full">
          {renderEditor()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full" ref={containerRef}>
      {isExtended ? (
        <div className="w-full overflow-x-auto">
          {editorContainer}
        </div>
      ) : (
        editorContainer
      )}
    </div>
  );
});

EditorSection.displayName = "EditorSection";
