import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

// Auto-save disabled for debugging jitter issue

const HtmlBuilder: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, currentTask, setCurrentTask, updateTask, getCompanyById } = useTaskContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const editorRef = useRef<EditorSectionRef>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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
  const [featuredImg, setFeaturedImg] = useState<string | null>(null);
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [featuredAlt, setFeaturedAlt] = useState('');
  const [showFeaturedDropdown, setShowFeaturedDropdown] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setLoadingTask(false);
      return;
    }
    if (!tasks.length) return; // Wait for tasks to load

    const found = tasks.find(t => t.id === taskId);
    if (found) {
      setCurrentTask(found);
      setLoadingTask(false);
    } else {
      setLoadingTask(false);
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line
  }, [taskId, tasks]);

  // Persist currentTask.id to localStorage
  useEffect(() => {
    if (currentTask?.id) {
      localStorage.setItem('lastTaskId', currentTask.id);
    }
  }, [currentTask?.id]);

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

  // Auto-save disabled for debugging jitter issue

  const saveChanges = () => {
    if (currentTask && currentTask.id) {
      updateTask(currentTask.id, {
        htmlContent,
        companyId,
        notes,
        type: pageType,
      });
      setLastSavedAt(new Date());
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
      description: 'The value has been copied.',
      duration: 2000,
    });
  };

  // Show loading spinner while waiting for tasks
  if (loadingTask) return <div>Loading task...</div>;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[radial-gradient(circle,rgba(60,60,80,0.2)_1px,transparent_1px)] [background-size:32px_32px]">
      {/* Go to bottom button at the top */}
      <div className="w-full flex justify-center mt-4">
        <Button variant="outline" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
          Go to bottom
        </Button>
      </div>
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
              {/* Featured IMG section spanning columns 2 and 3 */}
              <div className="bg-card rounded-lg p-4 flex flex-row items-center col-span-3" style={{ gridColumn: '1 / span 3', minHeight: '110px' }}>
                {/* Dropdown and Select button */}
                <div className="flex flex-col items-start min-w-[180px] pr-4">
                  <label className="font-medium mb-1">Featured IMG</label>
                  <div className="relative flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFeaturedDropdown(v => !v)}
                      type="button"
                      className="w-32 justify-between"
                    >
                      {featuredImg ? (
                        <span
                          className="truncate overflow-hidden whitespace-nowrap max-w-[100px] inline-block"
                          title={currentTask?.images?.find(img => img.url === featuredImg)?.name || ''}
                        >
                          {currentTask?.images?.find(img => img.url === featuredImg)?.name || 'Select image'}
                        </span>
                      ) : 'Select image'}
                      <span className="ml-2">▼</span>
                    </Button>
                    {/* Dropdown popover */}
                    {showFeaturedDropdown && (
                      <div className="absolute left-0 top-full z-10 mt-1 w-40 bg-background border border-border rounded shadow-lg">
                        <ul className="max-h-48 overflow-auto">
                          {(currentTask?.images || []).map(img => (
                            <li
                              key={img.url}
                              className={`px-3 py-2 cursor-pointer hover:bg-muted ${featuredImg === img.url ? 'bg-muted' : ''}`}
                              onClick={() => {
                                setFeaturedImg(img.url);
                                setShowFeaturedDropdown(false);
                              }}
                            >
                              {img.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                {/* Preview of selected image */}
                <div className="flex flex-col items-center justify-center min-w-[120px] px-4">
                  {featuredImg ? (
                    <img src={featuredImg} alt="Featured preview" className="max-h-24 max-w-24 rounded shadow border" />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center border rounded bg-muted text-muted-foreground">No image</div>
                  )}
                </div>
                {/* Title and ALT fields */}
                <div className="flex flex-col gap-2 flex-1 pl-4">
                  <div className="flex items-center gap-2">
                    <span className="w-12">Title:</span>
                    <Input
                      type="text"
                      value={featuredTitle}
                      onChange={e => setFeaturedTitle(e.target.value)}
                      className="flex-1"
                      placeholder="Enter title"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleCopy(featuredTitle)} disabled={!featuredTitle}>copy</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12">ALT:</span>
                    <Input
                      type="text"
                      value={featuredAlt}
                      onChange={e => setFeaturedAlt(e.target.value)}
                      className="flex-1"
                      placeholder="Enter alt text"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleCopy(featuredAlt)} disabled={!featuredAlt}>copy</Button>
                  </div>
                </div>
              </div>
            </div>
            {/* HTML Editor always visible and fills remaining space */}
            <div className="flex-1 flex flex-col" ref={editorContainerRef}>
              {/* Go to bottom button above editor */}
              <div className="w-full flex justify-end mb-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (editorContainerRef.current) {
                    editorContainerRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
                  }
                }}>
                  Go to bottom
                </Button>
              </div>
              <EditorSection
                ref={editorRef}
                htmlContent={htmlContent}
                onHtmlChange={handleHtmlChange}
                onUpdate={handleEditorUpdate}
                onCopyToClipboard={copyToClipboard}
                onSave={saveChanges}
                lastSavedAt={lastSavedAt}
              />
              {/* Go to top button below editor */}
              <div className="w-full flex justify-end mt-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (editorContainerRef.current) {
                    editorContainerRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
                  }
                }}>
                  Go to top
                </Button>
              </div>
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
