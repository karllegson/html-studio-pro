import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Check } from 'lucide-react';
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
import GreenCircleCheckbox from '@/components/ui/GreenCircleCheckbox';
import CopyButton from '@/components/ui/CopyButton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Auto-save disabled for debugging jitter issue

const HtmlBuilder: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, currentTask, setCurrentTask, updateTask, getCompanyById, tasksLoading } = useTaskContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const editorRef = useRef<EditorSectionRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [htmlContent, setHtmlContent] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [notes, setNotes] = useState('');
  const [pageType, setPageType] = useState<TaskType>(TaskType.BLOG);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ from: 0, to: 0 });
  const [reviewsTag, setReviewsTag] = useState('');
  const [faqTag, setFaqTag] = useState('');
  const [featuredImg, setFeaturedImg] = useState<string | null>(null);
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [featuredAlt, setFeaturedAlt] = useState('');
  const [showFeaturedDropdown, setShowFeaturedDropdown] = useState(false);

  // Track if we've finished the initial load
  const [tasksLoaded, setTasksLoaded] = useState(false);

  const [widgetTitle, setWidgetTitle] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaUrl, setMetaUrl] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [checkedFields, setCheckedFields] = useState<{ [key: string]: boolean }>({});

  const [instructionsToLink, setInstructionsToLink] = useState('');
  const [instructionsChecked, setInstructionsChecked] = useState(false);

  const [mapsLocation, setMapsLocation] = useState('');
  const [mapsEmbedCode, setMapsEmbedCode] = useState('');
  const [mapsChecked, setMapsChecked] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);

  const [teamworkLink, setTeamworkLink] = useState('');
  const [googleDocLink, setGoogleDocLink] = useState('');

  const [featuredImgChecked, setFeaturedImgChecked] = useState(false);

  // Mark tasks as loaded when they arrive
  useEffect(() => {
    if (tasks.length > 0) setTasksLoaded(true);
  }, [tasks]);

  // Wait for tasks to load before redirecting
  useEffect(() => {
    if (!taskId) return;
    if (tasksLoading) return;

    const found = tasks.find(t => t.id === taskId);
    if (found) {
      setCurrentTask(found);
    } else if (!tasksLoading && tasks.length > 0) {
      navigate("/", { replace: true });
    }
  }, [taskId, tasksLoading, tasks, setCurrentTask, navigate]);

  useEffect(() => {
    if (!currentTask) {
      navigate('/');
      return;
    }

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

  const saveChanges = () => {
    if (currentTask && currentTask.id) {
      updateTask(currentTask.id, {
        htmlContent,
        companyId,
        notes,
        type: pageType,
      });
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

  // Remove the loading spinner/message
  if (tasksLoading) {
    return null;
  }

  // If currentTask is set, render the builder UI
  if (currentTask) {
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
                  onPageTypeChange={handlePageTypeChange}
                  onlyTagsAndComponents={true}
                />
              </div>
            </div>
            {/* Main Content: 3 columns, grouped cards as in wireframe, notes, and editor */}
            <div className="flex flex-col h-full">
              <div className="grid grid-cols-3 gap-3 mb-2">
                {/* Row 1 */}
                <div className="bg-card rounded-lg p-4 flex flex-col">
                  {/* Company Section */}
                  <CompanySection
                    companyId={companyId}
                    pageType={pageType}
                    teamworkLink={teamworkLink}
                    googleDocLink={googleDocLink}
                    onCompanyChange={handleCompanyChange}
                    onPageTypeChange={handlePageTypeChange}
                    onTeamworkLinkChange={setTeamworkLink}
                    onGoogleDocLinkChange={setGoogleDocLink}
                  />
                </div>
                <div className="bg-card rounded-lg p-4 flex flex-col max-h-[400px]">
                  {/* HTML Templates */}
                  <CompanyTemplateSection
                    companyId={companyId}
                    onInsertTemplate={handleInsertComponent}
                  />
                  {/* Contact Us Link */}
                  <div className="mt-3">
                    <label className="text-sm font-medium mb-1 block">Contact Us Link</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={contactLink}
                        onChange={e => setContactLink(e.target.value)}
                        className="font-mono text-xs flex-1"
                        placeholder="Paste Contact Us link"
                      />
                      <CopyButton value={contactLink} />
                    </div>
                  </div>
                  {/* Image file name to link converter */}
                  <div className="mt-3">
                    <h3 className="text-lg font-medium mb-2">Image file name to link converter</h3>
                    <ImageFilenameConverter companyDomain={getCompanyById(companyId)?.contactLink} />
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 flex flex-col max-h-[400px]">
                  <h3 className="text-lg font-medium mb-2">Photos</h3>
                  <div className="overflow-auto h-full">
                    <PhotoUploadPreview 
                      companyName={getCompanyById(companyId)?.name} 
                      pageType={pageType} 
                      taskId={currentTask?.id} 
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="bg-card rounded-lg p-4 flex flex-col">
                  {/* Tags link */}
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
                      <CopyButton value={reviewsTag} />
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
                      <CopyButton value={faqTag} />
                    </div>
                  </div>
                </div>
                <div className="col-span-2 bg-card rounded-lg p-4 flex flex-row items-center">
                  {/* Featured IMG section */}
                  <div className="flex flex-col items-start min-w-[180px] pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="font-medium">Featured IMG</label>
                      <GreenCircleCheckbox
                        checked={featuredImgChecked}
                        onChange={e => setFeaturedImgChecked(e.target.checked)}
                      />
                    </div>
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
                      <CopyButton value={featuredTitle} />
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
                      <CopyButton value={featuredAlt} />
                    </div>
                  </div>
                </div>
              </div>
              {/* HTML Editor always visible and fills remaining space */}
              <div className="flex-1 flex flex-col" ref={editorContainerRef}>
                <EditorSection
                  ref={editorRef}
                  htmlContent={htmlContent}
                  onHtmlChange={handleHtmlChange}
                  onUpdate={handleEditorUpdate}
                  onSave={saveChanges}
                />
                {/* Go to top button below editor */}
                <div className="w-full flex justify-center mt-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    try {
                      // Scroll to the very top of the page
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } catch (error) {
                      console.error('Error scrolling to top:', error);
                    }
                  }}>
                    Go to top
                  </Button>
                </div>
                {/* 2x2 Section Grid with Notes in bottom right as the cell itself */}
                <div className="w-full max-w-4xl mx-auto mt-6 grid grid-cols-2 grid-rows-2 gap-4">
                  {/* Top-left cell: Widget/Meta fields */}
                  <div className="border rounded p-4 min-h-[80px] flex flex-col justify-center">
                    {[
                      { label: 'Widget Title', key: 'widgetTitle', value: widgetTitle, setValue: setWidgetTitle },
                      { label: 'Meta Title', key: 'metaTitle', value: metaTitle, setValue: setMetaTitle },
                      { label: 'Meta URL', key: 'metaUrl', value: metaUrl, setValue: setMetaUrl },
                      { label: 'Meta Description', key: 'metaDescription', value: metaDescription, setValue: setMetaDescription },
                    ].map((item, idx) => (
                      <div key={item.key} className="flex items-center gap-2 mb-3 last:mb-0">
                        <span className="w-28">{item.label}</span>
                        <Input
                          type="text"
                          className="flex-1"
                          value={item.value}
                          onChange={e => item.setValue(e.target.value)}
                          placeholder={item.label}
                        />
                        <CopyButton value={item.value} />
                        <GreenCircleCheckbox
                          checked={!!checkedFields[item.key]}
                          onChange={e => setCheckedFields(f => ({ ...f, [item.key]: e.target.checked }))}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Top-right cell: Google Maps Embed */}
                  <div className="border rounded p-4 min-h-[80px] flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="mx-auto font-medium text-center w-full">Google Maps Embed</span>
                      <GreenCircleCheckbox
                        checked={mapsChecked}
                        onChange={e => setMapsChecked(e.target.checked)}
                        className="ml-2"
                      />
                    </div>
                    <label className="text-sm mb-1">Enter a City, ST:</label>
                    <Input
                      type="text"
                      value={mapsLocation}
                      onChange={e => setMapsLocation(e.target.value)}
                      placeholder="e.g., Acton, MA"
                      className="mb-2"
                    />
                    <Button
                      type="button"
                      className="mb-2 w-fit"
                      onClick={() => {
                        if (!mapsLocation.trim()) return;
                        const encoded = encodeURIComponent(mapsLocation.trim());
                        window.open(`https://www.google.com/maps/place/${encoded}`, '_blank');
                      }}
                    >
                      Open in Google Maps
                    </Button>
                    <div className="text-xs text-muted-foreground mb-1">
                      <strong>Instructions:</strong> In the new tab, click "Share" → "Embed a map" → choose "Satellite" → copy the iframe code and paste it below:
                    </div>
                    <div className="flex items-center gap-2">
                      <Textarea
                        rows={3}
                        value={mapsEmbedCode}
                        onChange={e => setMapsEmbedCode(e.target.value)}
                        placeholder="Paste your iframe code here..."
                        className="flex-1"
                      />
                      <CopyButton value={mapsEmbedCode} />
                    </div>
                  </div>
                  {/* Bottom-left cell: Instructions to Link */}
                  <div className="border rounded p-4 min-h-[80px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="mx-auto font-medium text-center w-full">Instructions to Link</span>
                      <GreenCircleCheckbox
                        checked={instructionsChecked}
                        onChange={e => setInstructionsChecked(e.target.checked)}
                        className="ml-2"
                      />
                    </div>
                    <Textarea
                      className="rounded-lg border p-2 mt-2 flex-1 resize-none"
                      rows={4}
                      value={instructionsToLink}
                      onChange={e => setInstructionsToLink(e.target.value)}
                      placeholder="Enter instructions..."
                    />
                  </div>
                  {/* Bottom-right cell: Notes */}
                  <div className="border rounded p-4 min-h-[80px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="mx-auto font-medium text-center w-full">Notes</span>
                    </div>
                    <Textarea
                      className="rounded-lg border p-2 mt-2 flex-1 resize-none"
                      rows={4}
                      placeholder="Enter notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Help button at the bottom right, not floating */}
        <div className="w-full flex justify-end mt-4 mb-4">
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="lg" className="px-8 py-2 text-lg font-semibold rounded-full shadow-md mx-4 my-1">
                Help
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Help Topics</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="html-editor">
                <TabsList>
                  <TabsTrigger value="html-editor">HTML Editor</TabsTrigger>
                  <TabsTrigger value="company-section">Company Section</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="maps-embed">Google Maps Embed</TabsTrigger>
                </TabsList>
                <TabsContent value="html-editor">
                  <p>Use the HTML editor to create and edit your content. You can insert tags and components using the sidebar.</p>
                </TabsContent>
                <TabsContent value="company-section">
                  <p>Select a company and manage contact links and page types.</p>
                </TabsContent>
                <TabsContent value="notes">
                  <p>Add notes to keep track of important information.</p>
                </TabsContent>
                <TabsContent value="maps-embed">
                  <p>Enter a location to generate an embed code for Google Maps.</p>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // If tasks are loaded and the task is not found, redirect will have already happened
  return null;
};

export default HtmlBuilder;
