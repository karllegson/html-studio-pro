import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy } from 'lucide-react';
import { TaskStatus, TaskType } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditorSection, EditorSectionRef } from '@/components/html-builder/EditorSection';
import { SidebarContent } from '@/components/html-builder/SidebarContent';
import { CompanySection } from '@/components/html-builder/CompanySection';
import { CompanyTemplateSection } from '@/components/html-builder/CompanyTemplateSection';
import { ImageFilenameConverter } from '@/components/html-builder/ImageFilenameConverter';
import { PhotoUploadPreview } from '@/components/html-builder/PhotoUploadPreview';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NotesSection } from '@/components/html-builder/NotesSection';

// Auto-save interval in milliseconds (5 seconds)
const AUTO_SAVE_INTERVAL = 5000;

const HtmlBuilder: React.FC = () => {
  const { currentTask, updateTask, getCompanyById } = useTaskContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const editorRef = useRef<EditorSectionRef>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [htmlContent, setHtmlContent] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [notes, setNotes] = useState('');
  const [pageType, setPageType] = useState<TaskType>(TaskType.BLOG);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ from: 0, to: 0 });
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [reviewsTag, setReviewsTag] = useState('');
  const [faqTag, setFaqTag] = useState('');

  useEffect(() => {
    if (!currentTask) {
      navigate('/');
      return;
    }

    // Set the task to "IN_PROGRESS" when opened
    if (currentTask.status === TaskStatus.RECENTLY_DELETED) {
      updateTask(currentTask.id, { status: TaskStatus.IN_PROGRESS });
    }

    setHtmlContent(currentTask.htmlContent);
    setCompanyId(currentTask.companyId);
    setNotes(currentTask.notes);
    setPageType(currentTask.type || TaskType.BLOG);

    const company = getCompanyById(currentTask.companyId);
    if (company) {
      setContactLink(company.contactLink);
    }
  }, [currentTask, navigate, getCompanyById, updateTask]);

  // Auto-save functionality
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up a new timer for auto-saving
    if (currentTask) {
      autoSaveTimerRef.current = setInterval(() => {
        saveChanges();
      }, AUTO_SAVE_INTERVAL);
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [htmlContent, companyId, notes, pageType]);

  const saveChanges = () => {
    if (currentTask) {
      updateTask(currentTask.id, {
        htmlContent,
        companyId,
        notes,
        type: pageType,
      });
      setLastSavedAt(new Date());
      // Do not show toast for manual saves or auto-saves
    }
  };

  const handleCompanyChange = (value: string) => {
    setCompanyId(value);
    
    if (currentTask) {
      updateTask(currentTask.id, { companyId: value });
    }
    
    const company = getCompanyById(value);
    if (company) {
      setContactLink(company.contactLink);
    }
  };

  const handlePageTypeChange = (value: string) => {
    // Map string to TaskType enum
    let mappedType: TaskType = TaskType.BLOG;
    if (value === TaskType.SUB_PAGE) mappedType = TaskType.SUB_PAGE;
    else if (value === TaskType.LANDING_PAGE) mappedType = TaskType.LANDING_PAGE;
    setPageType(mappedType);
    if (currentTask) {
      updateTask(currentTask.id, { type: mappedType });
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    
    if (currentTask) {
      updateTask(currentTask.id, { notes: value });
    }
  };

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    
    // Don't update the task here to avoid too many updates
    // The auto-save will handle it
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
      duration: 2000,
    });
  };

  const handleTagClick = (openTag: string, closeTag: string | null) => {
    const view = editorRef.current?.getView();
    if (!view) return;
    
    const selection = view.state.selection.main;
    
    // Store the current cursor position
    const currentPosition = { from: selection.from, to: selection.to };
    
    const selectedContent = view.state.doc.sliceString(selection.from, selection.to);
    
    // If text is selected, wrap it with tags
    if (selectedContent && closeTag) {
      const updatedContent = view.state.doc.toString().slice(0, selection.from) + 
        openTag + selectedContent + closeTag + 
        view.state.doc.toString().slice(selection.to);
      
      setHtmlContent(updatedContent);
      
      // Restore cursor position after the tag + selected content
      setTimeout(() => {
        if (view) {
          // Focus on editor and place cursor after the inserted tags and content
          view.focus();
          const newPosition = selection.from + openTag.length + selectedContent.length;
          view.dispatch({
            selection: { anchor: newPosition, head: newPosition }
          });
        }
      }, 0);
    } 
    // If no text is selected, insert the tag at cursor position
    else {
      const updatedContent = view.state.doc.toString().slice(0, selection.from) + 
        openTag + 
        view.state.doc.toString().slice(selection.from);
      
      setHtmlContent(updatedContent);
      
      // Restore cursor position after the inserted tag
      setTimeout(() => {
        if (view) {
          // Focus on editor and place cursor after the inserted tag
          view.focus();
          const newPosition = selection.from + openTag.length;
          view.dispatch({
            selection: { anchor: newPosition, head: newPosition }
          });
        }
      }, 0);
    }
  };

  const handleInsertComponent = (html: string) => {
    const view = editorRef.current?.getView();
    if (!view) return;
    
    const selection = view.state.selection.main;
    
    // Insert at cursor position
    const updatedContent = view.state.doc.toString().slice(0, selection.from) + 
      html + 
      view.state.doc.toString().slice(selection.from);
    
    setHtmlContent(updatedContent);
    
    // Maintain cursor position
    setTimeout(() => {
      if (view) {
        view.focus();
        const newPosition = selection.from + html.length;
        view.dispatch({
          selection: { anchor: newPosition, head: newPosition }
        });
      }
    }, 0);
  };

  const handleEditorUpdate = (viewUpdate: any) => {
    const state = viewUpdate.state;
    const selection = state.selection.main;
    setSelectedText(state.doc.sliceString(selection.from, selection.to));
    setCursorPosition({ from: selection.from, to: selection.to });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The tag link has been copied.',
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[radial-gradient(circle,rgba(60,60,80,0.2)_1px,transparent_1px)] [background-size:32px_32px]">
      <div className="max-w-full px-4 py-4 mx-auto flex-1 flex flex-col pb-8">
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-[260px_1fr]"}`}>
          {/* Left Sidebar: Back button + Tags/Components, sticky */}
          <div className="sticky top-4 h-[calc(100vh-2rem)] flex flex-col gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                saveChanges();
                if (currentTask && currentTask.status !== TaskStatus.IN_PROGRESS) {
                  updateTask(currentTask.id, { status: TaskStatus.IN_PROGRESS });
                }
                navigate('/');
              }} 
              className="shrink-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <div className="flex-1 overflow-hidden">
              <SidebarContent 
                companyId={companyId}
                contactLink={contactLink}
                notes={notes}
                pageType={pageType}
                onTagClick={handleTagClick}
                onInsertComponent={handleInsertComponent}
                onCompanyChange={handleCompanyChange}
                onContactLinkChange={setContactLink}
                onNotesChange={handleNotesChange}
                onCopyToClipboard={copyToClipboard}
                onPageTypeChange={handlePageTypeChange}
                onlyTagsAndComponents={true}
              />
            </div>
          </div>
          {/* Main Content: 3 columns, grouped cards as in wireframe, notes, and editor */}
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-3 gap-3 items-start mb-2">
              {/* Column 1: Company card, then Tags link */}
              <div className="flex flex-col gap-3">
                <div className="bg-card rounded-lg p-4 flex flex-col min-h-[420px]">
                  <CompanySection
                    companyId={companyId}
                    contactLink={contactLink}
                    pageType={pageType}
                    onCompanyChange={handleCompanyChange}
                    onContactLinkChange={setContactLink}
                    onCopyToClipboard={copyToClipboard}
                    onPageTypeChange={handlePageTypeChange}
                  />
                </div>
                {/* Tags Link Section under Company card */}
                <div className="bg-card rounded-lg p-4 flex flex-col">
                  <h3 className="text-lg font-medium mb-2">Tags link</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-32">Review</span>
                      <Select value={reviewsTag} onValueChange={setReviewsTag}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="review-tag-1">Review Tag 1</SelectItem>
                          <SelectItem value="review-tag-2">Review Tag 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => handleCopy(reviewsTag)} disabled={!reviewsTag}>copy</Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-32">FAQ</span>
                      <Select value={faqTag} onValueChange={setFaqTag}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faq-tag-1">FAQ Tag 1</SelectItem>
                          <SelectItem value="faq-tag-2">FAQ Tag 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => handleCopy(faqTag)} disabled={!faqTag}>copy</Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Column 2: HTML Templates card, then Image File Name Converter card */}
              <div className="flex flex-col gap-3">
                <div className="bg-card rounded-lg p-4 flex flex-col">
                  <CompanyTemplateSection
                    companyId={companyId}
                    onInsertTemplate={handleInsertComponent}
                  />
                </div>
                <div className="bg-card rounded-lg p-4 flex flex-col">
                  <h3 className="text-lg font-medium mb-2">Image file name to link converter</h3>
                  <ImageFilenameConverter companyDomain={getCompanyById(companyId)?.contactLink} />
                </div>
              </div>
              {/* Column 3: Photos card (min-h to match left column) */}
              <div>
                <div className="bg-card rounded-lg p-4 flex flex-col min-h-[420px]">
                  <h3 className="text-lg font-medium mb-2">Photos</h3>
                  <PhotoUploadPreview 
                    companyName={getCompanyById(companyId)?.name} 
                    pageType={pageType} 
                    taskId={currentTask?.id} 
                  />
                </div>
              </div>
            </div>
            {/* HTML Editor always visible and fills remaining space */}
            <div className="flex-1 flex flex-col">
              <EditorSection
                ref={editorRef}
                htmlContent={htmlContent}
                onHtmlChange={handleHtmlChange}
                onUpdate={handleEditorUpdate}
                onCopyToClipboard={copyToClipboard}
                onSave={saveChanges}
                lastSavedAt={lastSavedAt}
              />
              {/* Notes section under HTML Editor */}
              <div className="max-w-lg self-center w-full mt-4">
                <NotesSection notes={notes} onNotesChange={handleNotesChange} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HtmlBuilder;
