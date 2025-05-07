import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { Button } from '@/components/ui/button';
import { Copy, Save, Maximize2, Minimize2, Plus, Minus, ArrowDown } from 'lucide-react';
import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { foldKeymap } from '@codemirror/language';
import { html } from '@codemirror/lang-html';
import { tags } from '@lezer/highlight';
import { HighlightStyle } from '@codemirror/language';
import CopyButton from '@/components/ui/CopyButton';

// Custom syntax highlighting theme
const customHighlightStyle = HighlightStyle.define([
  { tag: tags.tagName, color: '#ff79c6' }, // HTML tags
  { tag: tags.attributeName, color: '#8be9fd' }, // Attributes
  { tag: tags.string, color: '#f1fa8c' }, // Strings
  { tag: tags.comment, color: '#6272a4' }, // Comments
  { tag: tags.number, color: '#bd93f9' }, // Numbers
  { tag: tags.keyword, color: '#ff79c6' }, // Keywords
  { tag: tags.operator, color: '#ff79c6' }, // Operators
  { tag: tags.bracket, color: '#ff79c6' }, // Brackets
  { tag: tags.className, color: '#8be9fd' }, // Classes
  { tag: tags.propertyName, color: '#8be9fd' }, // Properties
  { tag: tags.variableName, color: '#f8f8f2' }, // Variables
  { tag: tags.definition(tags.variableName), color: '#50fa7b' }, // Variable definitions
  { tag: tags.regexp, color: '#ffb86c' }, // Regular expressions
  { tag: tags.escape, color: '#ffb86c' }, // Escape sequences
  { tag: tags.meta, color: '#6272a4' }, // Meta tags
  { tag: tags.link, color: '#8be9fd' }, // Links
  { tag: tags.heading, color: '#ff79c6', fontWeight: 'bold' }, // Headings
  { tag: tags.strong, color: '#ff79c6', fontWeight: 'bold' }, // Strong text
  { tag: tags.emphasis, color: '#ff79c6', fontStyle: 'italic' }, // Emphasized text
  { tag: tags.strikethrough, color: '#ff79c6', textDecoration: 'line-through' }, // Strikethrough
  { tag: tags.list, color: '#f8f8f2' }, // Lists
  { tag: tags.quote, color: '#f1fa8c', fontStyle: 'italic' }, // Quotes
  { tag: tags.invalid, color: '#ff5555' }, // Invalid syntax
]);

export interface EditorSectionRef {
  getView: () => EditorView | undefined;
}

interface EditorSectionProps {
  htmlContent: string;
  onHtmlChange: (value: string) => void;
  onUpdate: (viewUpdate: ViewUpdate) => void;
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
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [isExtended, setIsExtended] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  
  // Expose a method to get the editor view
  useImperativeHandle(ref, () => ({
    getView: () => editorRef.current?.view
  }));

  // Force override minHeight/maxHeight on .cm-scroller after render
  useEffect(() => {
    const interval = setInterval(() => {
      const scroller = document.querySelector('.cm-scroller') as HTMLElement;
      if (scroller) {
        scroller.style.minHeight = 'unset';
        if (!isExtended) {
          scroller.style.maxHeight = '600px';
          scroller.style.overflowY = 'auto';
        } else {
          scroller.style.maxHeight = 'unset';
          scroller.style.overflowY = 'visible';
        }
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isExtended]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 10));
  };

  // Conditional class for text wrapping
  const wrapClass = !isExtended ? 'cm-wrap-lines' : '';

  // Enhanced extensions with syntax highlighting
  const extensions = [
    html(),
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    indentOnInput(),
    syntaxHighlighting(customHighlightStyle),
    foldGutter(),
    closeBrackets(),
    autocompletion(),
    history({ maxDepth: 100 }),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...closeBracketsKeymap,
      ...completionKeymap,
      ...searchKeymap,
      ...lintKeymap,
    ]),
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    EditorView.theme({
      '&': {
        fontSize: `${fontSize}px`,
      },
      '.cm-scroller': {
        fontFamily: 'monospace',
      },
      '.cm-content': {
        padding: '0.5rem 0',
      },
      '.cm-line': {
        padding: '0 0.5rem',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      '.cm-gutters': {
        backgroundColor: '#1a1a2e',
        color: '#6272a4',
        border: 'none',
      },
      '.cm-gutterElement': {
        padding: '0 0.5rem',
      },
      '.cm-matchingBracket': {
        color: '#50fa7b',
        fontWeight: 'bold',
      },
      '.cm-nonmatchingBracket': {
        color: '#ff5555',
        fontWeight: 'bold',
      },
    }),
  ];

  return (
    <div className={
      `bg-[#23263a] border border-border shadow-xl rounded-xl flex flex-col w-full px-0 my-4 focus-within:ring-2 focus-within:ring-primary/60 ${isExtended ? '' : ''}`
    }>
      <div className="p-2 bg-secondary text-secondary-foreground text-sm font-mono flex justify-between items-center rounded-t-xl">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExtended(!isExtended)}
            className="flex items-center gap-1"
          >
            {isExtended ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
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
            onClick={() => {
              try {
                const view = editorRef.current?.view;
                if (view) {
                  // Get the last line number
                  const lastLine = view.state.doc.lines;
                  // Move cursor to the end of the last line
                  const pos = view.state.doc.line(lastLine).to;
                  // Scroll into view and focus
                  view.dispatch({
                    selection: { anchor: pos, head: pos },
                    scrollIntoView: true
                  });
                  view.focus();
                } else {
                  // Fallback to DOM scrolling if view is not available
                  const scroller = document.querySelector('.cm-scroller') as HTMLElement;
                  if (scroller) {
                    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
                  }
                }
              } catch (error) {
                console.error('Error scrolling to bottom:', error);
              }
            }}
            className="flex items-center gap-1"
          >
            <ArrowDown size={14} />
            Scroll Bottom
          </Button>
        </div>
        {lastSavedAt && (
          <div className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
            Last saved: {lastSavedAt.toLocaleTimeString()}
          </div>
        )}
      </div>
      <div className="flex-1 rounded-b-xl overflow-hidden">
        <CodeMirror
          ref={editorRef}
          value={htmlContent}
          theme={oneDark}
          extensions={extensions}
          onChange={onHtmlChange}
          className={`text-editor-foreground cm-s-dark ${wrapClass}`}
          onUpdate={onUpdate}
          style={{ fontSize: `${fontSize}px` }}
        />
      </div>
    </div>
  );
});

EditorSection.displayName = "EditorSection";
