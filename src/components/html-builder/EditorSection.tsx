import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Save, Maximize2, Minimize2, Plus, Minus, ArrowDown, Monitor, Eye, EyeOff, History, Sparkles, Archive } from 'lucide-react';
import CopyButton from '@/components/ui/CopyButton';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface EditorSectionRef {
  getView: () => EditorView | undefined;
}

interface Version {
  content: string;
  timestamp: Date;
  isCurrent: boolean;
}

interface EditorSectionProps {
  htmlContent: string;
  onHtmlChange: (value: string) => void;
  onUpdate: () => void;
  onSave: () => void;
  lastSavedAt?: Date | null;
  onToggleEditorOnlyMode?: () => void;
  editorOnlyMode?: boolean;
  sidebarVisible?: boolean;
  setSidebarVisible?: (visible: boolean) => void;
  onHighlight?: () => void;
  highlightDisabled?: boolean;
  versionHistory?: Version[];
  onVersionSelect?: (index: number) => void;
  viewingVersionIndex?: number | null;
}

// Custom theme for professional dark theme with better code visibility
const professionalDarkTheme = EditorView.theme({
  '&': {
    color: 'hsl(0, 0%, 95%)',
    backgroundColor: 'hsl(0, 0%, 12%)',
  },
  '.cm-content': {
    color: 'hsl(0, 0%, 95%)',
    caretColor: 'hsl(38, 85%, 45%)',
  },
  '.cm-lineNumbers, .cm-gutters': {
    backgroundColor: 'hsl(0, 0%, 12%)',
    color: 'hsl(0, 0%, 65%)',
    border: 'none',
  },
});

export const EditorSection = forwardRef<EditorSectionRef, EditorSectionProps>(({
  htmlContent,
  onHtmlChange,
  onUpdate,
  onSave,
  lastSavedAt,
  onToggleEditorOnlyMode,
  editorOnlyMode,
  sidebarVisible,
  setSidebarVisible,
  onHighlight,
  highlightDisabled,
  versionHistory = [],
  onVersionSelect,
  viewingVersionIndex = null,
}, ref) => {
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | undefined>(undefined);
  const [isExtended, setIsExtended] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  
  useImperativeHandle(ref, () => ({
    getView: () => editorViewRef.current
  }));

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 1, 24));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 1, 10));
  }, []);

  const handleChange = useCallback((value: string) => {
    onHtmlChange(value);
    onUpdate();
    // Ensure the editor view is focused after a change
    if (editorViewRef.current) {
      editorViewRef.current.focus();
    }
  }, [onHtmlChange, onUpdate]);

  // Add a useEffect to focus the editor view whenever htmlContent changes
  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current.focus();
    }
  }, [htmlContent]);

  const scrollToBottom = useCallback(() => {
    const mapsEmbedSection = document.getElementById('maps-embed-section');
    if (mapsEmbedSection) {
      mapsEmbedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Attach the EditorView instance to the ref when CodeMirror mounts
  const handleEditorView = useCallback((view: EditorView | undefined) => {
    editorViewRef.current = view;
  }, []);

  const renderEditor = () => (
    <div className="relative w-full min-h-[300px]" ref={editorDivRef}>
      <CodeMirror
        value={htmlContent}
        height="100%"
        theme={oneDark}
        extensions={[html({ autoCloseTags: false }), professionalDarkTheme]}
        onChange={handleChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLineGutter: false,
          highlightSelectionMatches: false
        }}
        style={{
          fontSize: `${fontSize}px`,
          minHeight: '300px',
          height: 'auto',
          maxHeight: 'none',
          width: '100%'
        }}
        onCreateEditor={handleEditorView}
      />
    </div>
  );

  const renderToolbar = () => (
    <div className="flex items-center gap-2 w-full">
      {/* Group 1: Expand/Sidebar Toggle */}
      <div className="flex items-center gap-2 mr-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExtended(!isExtended)}
          aria-label={isExtended ? "Collapse editor" : "Expand editor"}
        >
          {isExtended ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarVisible && setSidebarVisible(!sidebarVisible)}
          aria-label={sidebarVisible ? "Hide HTML Tags Sidebar" : "Show HTML Tags Sidebar"}
        >
          {sidebarVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="ml-1 text-xs">{sidebarVisible ? "Hide Tags" : "Show Tags"}</span>
        </Button>
      </div>
      {/* Group 2: Font size controls */}
      <div className="flex items-center gap-1 mr-4">
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
      {/* Group 3: Copy/Save */}
      <div className="flex items-center gap-2 mr-4">
        <CopyButton value={htmlContent} />
        <Button 
          variant="default" 
          size="sm"
          onClick={onSave}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Save size={14} />
          Save
        </Button>
      </div>
      {/* Group 4: Scroll/Focus */}
      <div className="flex items-center gap-2 mr-auto">
        <Button
          variant="ghost" 
          size="sm"
          onClick={scrollToBottom}
          className="flex items-center gap-1"
        >
          <ArrowDown size={14} />
          Scroll Bottom
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorOnlyMode ? "default" : "ghost"}
                size="sm"
                onClick={onToggleEditorOnlyMode}
                className={`flex items-center gap-1 ${editorOnlyMode ? 'bg-primary/80 text-white' : ''}`}
                aria-label={editorOnlyMode ? "Exit Focus Editor" : "Focus Editor"}
              >
                <Monitor size={16} />
                {editorOnlyMode ? "Exit Focus" : "Focus Editor"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{editorOnlyMode ? "Exit Focus Mode" : "Focus: Distraction-Free Editor"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Group 5: Version History - Far Right */}
      <div className="flex items-center gap-2 ml-auto">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setVersionHistoryOpen(true)}
          className="flex items-center gap-1"
        >
          <History size={14} />
          Version History
        </Button>
      </div>
    </div>
  );

  const editorContainer = (
    <div
      className={`bg-secondary border border-border shadow-lg rounded-2xl flex flex-col px-0 my-4 focus-within:ring-2 focus-within:ring-primary/60 transition-all duration-300 ${isExtended ? 'min-w-[1200px] w-[2000px] max-w-none' : 'w-full'} max-w-full overflow-x-auto`}
      style={{ maxWidth: '100%', overflowX: 'auto' }}
    >
      <div className="p-2 bg-secondary text-secondary-foreground text-sm font-mono flex justify-between items-center rounded-t-2xl">
        {renderToolbar()}
      </div>
      <div className="flex-1 rounded-b-2xl overflow-hidden" style={{overflow: 'hidden', borderRadius: '0 0 1rem 1rem'}}>
        <div className="w-full max-w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
          {renderEditor()}
        </div>
      </div>
    </div>
  );

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get all versions including current (if not in history yet)
  const allVersions = versionHistory.length > 0 
    ? versionHistory 
    : [{ content: htmlContent, timestamp: new Date(), isCurrent: true }];

  return (
    <div className={`w-full${editorOnlyMode ? ' h-screen overflow-auto bg-background' : ''}`}>
      {isExtended ? (
        <div className="w-full overflow-x-auto">
          {editorContainer}
        </div>
      ) : (
        editorContainer
      )}
      
      {/* Version History Dialog - HTML Code Only */}
      <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>HTML Code Version History</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              View and restore previous versions of your HTML code. Click a version to preview it in the editor.
            </p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {allVersions.map((version, index) => {
                const isCurrent = index === allVersions.length - 1;
                const isOldest = index === 0;
                const isNewest = isCurrent;
                const isViewing = viewingVersionIndex === index || (isCurrent && viewingVersionIndex === null);
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (onVersionSelect) {
                        onVersionSelect(index);
                      }
                    }}
                    className={`group relative p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      isViewing 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-foreground">
                            Version {allVersions.length - index}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isNewest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-md border border-green-500/20">
                                <Sparkles className="w-2.5 h-2.5" />
                                Newest
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-md border border-primary/20">
                                Current
                              </span>
                            )}
                            {isOldest && !isNewest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
                                <Archive className="w-2.5 h-2.5" />
                                Oldest
                              </span>
                            )}
                            {isViewing && !isCurrent && (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
                                Viewing
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{version.content.length.toLocaleString()} characters</span>
                          <span>•</span>
                          <span>{formatTimestamp(version.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {allVersions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No version history available. Save your HTML code to create versions.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

EditorSection.displayName = "EditorSection";
