import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Save, Maximize2, Minimize2, Plus, Minus, ArrowDown, Monitor, Eye, EyeOff } from 'lucide-react';
import CopyButton from '@/components/ui/CopyButton';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface EditorSectionRef {
  getView: () => EditorView | undefined;
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
}

// Custom theme for white text
const whiteTextTheme = EditorView.theme({
  '&': {
    color: '#fff',
    backgroundColor: '#23263a',
  },
  '.cm-content': {
    color: '#fff',
    caretColor: '#fff',
  },
  '.cm-lineNumbers, .cm-gutters': {
    backgroundColor: '#23263a',
    color: '#888',
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
}, ref) => {
  const editorDivRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | undefined>(undefined);
  const [isExtended, setIsExtended] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  
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
        extensions={[html({ autoCloseTags: false }), whiteTextTheme]}
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
    <div className="flex items-center gap-2">
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
          variant="outline" 
          size="sm"
          onClick={onSave}
          className="flex items-center gap-1"
        >
          <Save size={14} />
          Save
        </Button>
      </div>
      {/* Group 4: Scroll/Focus */}
      <div className="flex items-center gap-2">
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
    </div>
  );

  const editorContainer = (
    <div
      className={`bg-[#23263a] border border-border shadow-xl rounded-xl flex flex-col px-0 my-4 focus-within:ring-2 focus-within:ring-primary/60 transition-all duration-300 ${isExtended ? 'min-w-[1200px] w-[2000px] max-w-none' : 'w-full'} max-w-full overflow-x-auto`}
      style={{ maxWidth: '100%', overflowX: 'auto' }}
    >
      <div className="p-2 bg-secondary text-secondary-foreground text-sm font-mono flex justify-between items-center rounded-t-xl">
        {renderToolbar()}
      </div>
      <div className="flex-1 rounded-b-xl overflow-hidden" style={{overflow: 'hidden', borderRadius: '0 0 1rem 1rem'}}>
        <div className="w-full max-w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
          {renderEditor()}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full${editorOnlyMode ? ' h-screen overflow-auto bg-background' : ''}`}>
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
