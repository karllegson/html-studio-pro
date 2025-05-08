import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
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
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    indentOnInput(),
    syntaxHighlighting(customHighlightStyle),
    closeBrackets(),
    autocompletion(),
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
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
        boxSizing: 'border-box',
        width: '100%',
        overflowX: 'hidden',
      },
      '.cm-scroller': {
        fontFamily: 'monospace',
        overflow: 'hidden',
        width: '100%',
      },
      '.cm-content': {
        padding: '0.5rem',
        boxSizing: 'border-box',
        width: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowX: 'hidden',
        position: 'relative',
      },
      '.cm-gutters': {
        background: 'none',
        border: 'none',
        color: '#7c8696',
        minWidth: '24px',
        width: '24px',
        padding: 0,
        margin: 0,
      },
      '.cm-lineNumbers': {
        fontSize: '10px',
        fontFamily: 'monospace',
        opacity: 0.4,
        padding: 0,
        margin: 0,
        textAlign: 'right',
        width: '24px',
        minWidth: '24px',
      },
      '.cm-line': {
        padding: 0,
        width: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        position: 'relative',
      },
      '.cm-line::before': undefined,
      '.cm-activeLine': {
        background: 'transparent',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 'inherit',
      },
      '.cm-activeLineGutter': {
        background: 'transparent', // subtle background for gutter only
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

  // --- Render ---
  if (isExtended) {
    return (
      <div className="w-full overflow-x-auto">
        <div
          className={`bg-[#23263a] border border-border shadow-xl rounded-xl flex flex-col px-0 my-4 focus-within:ring-2 focus-within:ring-primary/60 transition-all duration-300`}
          style={{ minWidth: '1200px', width: '2000px', maxWidth: 'none' }}
        >
          <div className="p-2 bg-secondary text-secondary-foreground text-sm font-mono flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExtended(false)}
                aria-label="Collapse editor"
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
                onClick={() => {
                  try {
                    const view = editorRef.current?.view;
                    if (view) {
                      const lastLine = view.state.doc.lines;
                      const pos = view.state.doc.line(lastLine).to;
                      view.dispatch({
                        selection: { anchor: pos, head: pos },
                        scrollIntoView: true
                      });
                      view.focus();
                    } else {
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
          <div className="flex-1 rounded-b-xl overflow-hidden" style={{overflow: 'hidden', borderRadius: '0 0 1rem 1rem'}}>
            <div className="w-full max-w-full">
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`bg-[#23263a] border border-border shadow-xl rounded-xl flex flex-col px-0 my-4 focus-within:ring-2 focus-within:ring-primary/60 transition-all duration-300 w-full`}
        style={{ minWidth: '0', width: '100%', maxWidth: '100%' }}
      >
        <div className="p-2 bg-secondary text-secondary-foreground text-sm font-mono flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExtended(true)}
              aria-label="Expand editor"
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
              onClick={() => {
                try {
                  const view = editorRef.current?.view;
                  if (view) {
                    const lastLine = view.state.doc.lines;
                    const pos = view.state.doc.line(lastLine).to;
                    view.dispatch({
                      selection: { anchor: pos, head: pos },
                      scrollIntoView: true
                    });
                    view.focus();
                  } else {
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
        <div className="flex-1 rounded-b-xl overflow-hidden" style={{overflow: 'hidden', borderRadius: '0 0 1rem 1rem'}}>
          <div className="w-full max-w-full">
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
      </div>
    </div>
  );
});

EditorSection.displayName = "EditorSection";
