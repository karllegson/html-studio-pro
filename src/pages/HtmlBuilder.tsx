import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { TaskStatus, TaskType, TaskImage } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditorSection, EditorSectionRef } from '@/components/html-builder/EditorSection';
import { SidebarContent } from '@/components/html-builder/SidebarContent';
import { CompanySection } from '@/components/html-builder/CompanySection';
import { ImageFilenameConverter } from '@/components/html-builder/ImageFilenameConverter';
import { PhotoUploadPreview } from '@/components/html-builder/PhotoUploadPreview';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import GreenCircleCheckbox from '@/components/ui/GreenCircleCheckbox';
import CopyButton from '@/components/ui/CopyButton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CompanyTemplateList } from '@/components/html-builder/CompanyTemplateSection';
import { subscribeToCompanyTags, CompanyTags } from '@/utils/companyTags';
import { LinkDialog } from '@/components/html-builder/LinkDialog';

// Auto-save disabled for debugging jitter issue

const HtmlBuilder: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, currentTask, setCurrentTask, updateTask, getCompanyById, tasksLoading, getTemplatesByCompany, getBlogTemplatesFromAllCompanies } = useTaskContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if we're in images-only mode
  const isImagesOnlyMode = location.pathname.includes('/images');
  
  const isMobile = useIsMobile();
  const editorRef = useRef<EditorSectionRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [htmlContent, setHtmlContent] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [notes, setNotes] = useState('');
  const [pageType, setPageType] = useState<TaskType | undefined>(undefined);
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
  const [completionPopupOpen, setCompletionPopupOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [fileName: string]: boolean }>({});

  const [teamworkLink, setTeamworkLink] = useState('');
  const [googleDocLink, setGoogleDocLink] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [changeHistory, setChangeHistory] = useState<Array<{field: string, value: string, timestamp: string}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const updateQueue = useRef<Record<string, any>>({});
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef<Record<string, number>>({});
  const MAX_RETRIES = 3;
  const MAX_HISTORY = 50;

  const [images, setImages] = useState<TaskImage[]>([]);
  const [downloading, setDownloading] = useState(false);

  const [companyTags, setCompanyTags] = useState<CompanyTags | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [editorOnlyMode, setEditorOnlyMode] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const isTinyMobile = typeof window !== 'undefined' && window.innerWidth < 400;

  // Auto-hide sidebar on medium screens (480-1024px) for better responsive layout
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Hide sidebar on medium screens (480-1024px) to give more room for content
      if (width >= 480 && width < 1024) {
        setSidebarVisible(false);
      } else if (width >= 1024) {
        setSidebarVisible(true);
      }
      // Don't touch sidebar state on actual mobile (< 480px)
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage when offline
  useEffect(() => {
    if (isOffline && currentTask?.id) {
      const offlineData = {
        taskId: currentTask.id,
        updates: updateQueue.current,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`offline_updates_${currentTask.id}`, JSON.stringify(offlineData));
    }
  }, [isOffline, currentTask?.id, updateQueue.current]);

  // Load offline changes when coming back online
  useEffect(() => {
    if (!isOffline && currentTask?.id) {
      const offlineData = localStorage.getItem(`offline_updates_${currentTask.id}`);
      if (offlineData) {
        try {
          const { updates } = JSON.parse(offlineData);
          Object.entries(updates).forEach(([field, value]) => {
            debouncedUpdate(field, value);
          });
          localStorage.removeItem(`offline_updates_${currentTask.id}`);
        } catch (error) {
          console.error('Failed to load offline changes:', error);
        }
      }
    }
  }, [isOffline, currentTask?.id]);

  // Field validation rules with improved Google Doc link handling
  const validationRules = {
    metaTitle: (value: string) => value.length <= 60,
    metaDescription: (value: string) => value.length <= 160,
    metaUrl: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    teamworkLink: (value: string) => {
      if (!value) return true;
      return value.includes('teamwork.com');
    },
    googleDocLink: (value: string) => {
      if (!value) return true;
      // More flexible Google Docs URL validation
      const validPatterns = [
        /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/edit/,
        /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/view/,
        /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/preview/
      ];
      return validPatterns.some(pattern => pattern.test(value));
    }
  };

  // Batch update function with improved error handling
  const batchUpdate = async () => {
    if (currentTask?.id && Object.keys(updateQueue.current).length > 0) {
      setSaving(true);
      setSaveError(null);
      
      try {
        // Ensure all fields are properly initialized
        const updates = {
          ...updateQueue.current,
          // Add checkbox states
          featuredImgChecked: updateQueue.current.featuredImgChecked ?? false,
          mapsChecked: updateQueue.current.mapsChecked ?? false,
          instructionsChecked: updateQueue.current.instructionsChecked ?? false,
          // Add the checked fields object
          checkedFields: updateQueue.current.checkedFields ?? {},
          // Ensure optional fields are explicitly set to empty string if undefined
          googleDocLink: updateQueue.current.googleDocLink || '',
          teamworkLink: updateQueue.current.teamworkLink || '',
          notes: updateQueue.current.notes || '',
          featuredTitle: updateQueue.current.featuredTitle || '',
          featuredAlt: updateQueue.current.featuredAlt || '',
          widgetTitle: updateQueue.current.widgetTitle || '',
          metaTitle: updateQueue.current.metaTitle || '',
          metaUrl: updateQueue.current.metaUrl || '',
          metaDescription: updateQueue.current.metaDescription || '',
          instructionsToLink: updateQueue.current.instructionsToLink || '',
          mapsLocation: updateQueue.current.mapsLocation || '',
          mapsEmbedCode: updateQueue.current.mapsEmbedCode || '',
          selectedReviewTag: updateQueue.current.selectedReviewTag || '',
          selectedFaqTag: updateQueue.current.selectedFaqTag || ''
        };

        await updateTask(currentTask.id, updates);
        
        // Add to change history
        const newHistory = Object.entries(updates).map(([field, value]) => ({
          field,
          value: String(value),
          timestamp: new Date().toISOString()
        }));
        
        setChangeHistory(prev => {
          const updated = [...newHistory, ...prev].slice(0, MAX_HISTORY);
          return updated;
        });

        // Clear the queue and retry counts after successful update
        updateQueue.current = {};
        retryCount.current = {};
      } catch (error) {
        console.error('Failed to save changes:', error);
        setSaveError('Failed to save changes. Retrying...');
        
        // Retry logic for failed updates
        Object.keys(updateQueue.current).forEach(field => {
          retryCount.current[field] = (retryCount.current[field] || 0) + 1;
          if (retryCount.current[field] < MAX_RETRIES) {
            // Retry after 1 second
            setTimeout(() => {
              if (currentTask?.id) {
                updateTask(currentTask.id, { [field]: updateQueue.current[field] })
                  .catch(console.error);
              }
            }, 1000);
          } else {
            setSaveError(`Failed to save some changes after ${MAX_RETRIES} attempts. Please try again.`);
          }
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Debounced update function with error handling
  const debouncedUpdate = (field: string, value: any) => {
    if (currentTask?.id) {
      // Add to update queue
      updateQueue.current[field] = value;

      // Clear existing timeout
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }

      // Set new timeout
      updateTimeout.current = setTimeout(batchUpdate, 500);
    }
  };

  // Clean up timeout and retry counts on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      retryCount.current = {};
    };
  }, []);

  // Direct update handlers for each field
  const handleFeaturedTitleChange = (value: string) => {
    setFeaturedTitle(value);
    if (currentTask) {
      updateTask(currentTask.id, { featuredTitle: value });
    }
  };

  const handleFeaturedAltChange = (value: string) => {
    setFeaturedAlt(value);
    if (currentTask) {
      updateTask(currentTask.id, { featuredAlt: value });
    }
  };

  const handleWidgetTitleChange = (value: string) => {
    setWidgetTitle(value);
    if (currentTask) {
      updateTask(currentTask.id, { widgetTitle: value });
    }
  };

  const handleMetaTitleChange = (value: string) => {
    setMetaTitle(value);
    if (currentTask) {
      updateTask(currentTask.id, { metaTitle: value });
    }
  };

  const handleMetaUrlChange = (value: string) => {
    setMetaUrl(value);
    if (currentTask) {
      updateTask(currentTask.id, { metaUrl: value });
    }
  };

  const handleMetaDescriptionChange = (value: string) => {
    setMetaDescription(value);
    if (currentTask) {
      updateTask(currentTask.id, { metaDescription: value });
    }
  };

  const handleMapsLocationChange = (value: string) => {
    setMapsLocation(value);
    if (currentTask) {
      updateTask(currentTask.id, { mapsLocation: value });
    }
  };

  const handleMapsEmbedCodeChange = (value: string) => {
    setMapsEmbedCode(value);
    if (currentTask) {
      updateTask(currentTask.id, { mapsEmbedCode: value });
    }
  };

  const handleTeamworkLinkChange = (value: string) => {
    setTeamworkLink(value);
    if (currentTask) {
      updateTask(currentTask.id, { teamworkLink: value });
    }
  };

  const handleGoogleDocLinkChange = (value: string) => {
    setGoogleDocLink(value);
    if (currentTask) {
      updateTask(currentTask.id, { googleDocLink: value });
    }
  };

  // Unified text change handler with silent validation
  const handleTextChange = (field: string, value: string) => {
    // Basic validation
    if (value === undefined || value === null) {
      console.warn(`Invalid value for ${field}:`, value);
      return;
    }

    // Silent field-specific validation
    const validationRule = validationRules[field as keyof typeof validationRules];
    if (validationRule && !validationRule(value)) {
      // Just update the value without showing error
      console.warn(`Invalid value for ${field}:`, value);
    }

    // Update local state
    switch (field) {
      case 'notes':
        setNotes(value);
        break;
      case 'featuredTitle':
        handleFeaturedTitleChange(value);
        break;
      case 'featuredAlt':
        handleFeaturedAltChange(value);
        break;
      case 'widgetTitle':
        handleWidgetTitleChange(value);
        break;
      case 'metaTitle':
        handleMetaTitleChange(value);
        break;
      case 'metaUrl':
        handleMetaUrlChange(value);
        break;
      case 'metaDescription':
        handleMetaDescriptionChange(value);
        break;
      case 'instructionsToLink':
        setInstructionsToLink(value);
        break;
      case 'mapsLocation':
        handleMapsLocationChange(value);
        break;
      case 'mapsEmbedCode':
        handleMapsEmbedCodeChange(value);
        break;
      case 'teamworkLink':
        handleTeamworkLinkChange(value);
        break;
      case 'googleDocLink':
        handleGoogleDocLinkChange(value);
        break;
      case 'contactLink':
        setContactLink(value);
        break;
      default:
        console.warn(`Unknown field: ${field}`);
        return;
    }

    // Queue Firebase update with minimal feedback
    debouncedUpdate(field, value);
  };

  // Load initial values from task - only once on initial load
  useEffect(() => {
    if (!currentTask || !tasksLoaded) return;

    // Only run this ONCE when task is first loaded
    if (!htmlContent && !companyId && !notes && !featuredTitle && !metaTitle) {
      // Only auto-move out of Recently Deleted if NOT coming from the recently-deleted tab
      const dashboardTab = window.localStorage.getItem('dashboardTab');
      if (currentTask.status === TaskStatus.RECENTLY_DELETED && dashboardTab !== 'recently-deleted') {
        updateTask(currentTask.id, { status: TaskStatus.IN_PROGRESS });
      }

      // Load all field values from currentTask
      setHtmlContent(currentTask.htmlContent || '');
      setCompanyId(currentTask.companyId || '');
      setNotes(currentTask.notes || '');
      setPageType(currentTask.type);
      setTeamworkLink(currentTask.teamworkLink || '');
      setGoogleDocLink(currentTask.googleDocLink || '');
      setFeaturedTitle(currentTask.featuredTitle || '');
      setFeaturedAlt(currentTask.featuredAlt || '');
      setWidgetTitle(currentTask.widgetTitle || '');
      setMetaTitle(currentTask.metaTitle || '');
      setMetaUrl(currentTask.metaUrl || '');
      setMetaDescription(currentTask.metaDescription || '');
      setInstructionsToLink(currentTask.instructionsToLink || '');
      setMapsLocation(currentTask.mapsLocation || '');
      setMapsEmbedCode(currentTask.mapsEmbedCode || '');
      setFeaturedImg(currentTask.featuredImg || '');
      // Restore checkmark states from currentTask
      setCheckedFields(currentTask.checkedFields || {});
      // Load saved tags
      setReviewsTag(currentTask.selectedReviewTag || '');
      setFaqTag(currentTask.selectedFaqTag || '');
      const company = getCompanyById(currentTask.companyId);
      if (company) {
        setContactLink(company.contactLink || '');
      }
    }
  }, [currentTask, tasksLoaded, getCompanyById, updateTask]);

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
  }, [taskId, tasksLoading, tasks, setCurrentTask, navigate, isImagesOnlyMode]);

  // Save all changes (used for HTML editor and manual saves)
  const saveChanges = async () => {
    if (currentTask?.id) {
      setSaving(true);
      try {
        const updates = {
          htmlContent,
          companyId,
          notes,
          type: pageType,
          teamworkLink,
          googleDocLink,
          featuredTitle,
          featuredAlt,
          widgetTitle,
          metaTitle,
          metaUrl,
          metaDescription,
          instructionsToLink,
          mapsLocation,
          mapsEmbedCode,
          selectedReviewTag: reviewsTag,
          selectedFaqTag: faqTag
        };
        await updateTask(currentTask.id, updates);
        toast({
          title: "Changes saved",
          description: "All changes have been saved successfully.",
          duration: 2000
        });
      } catch (error) {
        console.error('Failed to save changes:', error);
        toast({
          title: "Error saving changes",
          description: "Some changes may not have been saved. Please try again.",
          variant: "destructive",
          duration: 3000
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCompanyChange = (value: string) => {
    setCompanyId(value);
    
    if (currentTask) {
      updateTask(currentTask.id, { companyId: value });
    }
    
    const company = getCompanyById(value);
    if (company) {
      setContactLink(company.contactLink || '');
    }

    // Auto-apply template if page type is already selected and HTML content is empty
    if (pageType && !htmlContent.trim()) {
      let availableTemplates = [];
      if (pageType === TaskType.BLOG) {
        // For blog posts, get templates from all companies
        availableTemplates = getBlogTemplatesFromAllCompanies();
      } else {
        // For other page types, get templates from the selected company
        const companyTemplates = getTemplatesByCompany(value);
        availableTemplates = companyTemplates.filter(template => 
          template.pageType === pageType && template.isActive
        );
      }

      // Apply the first available template
      if (availableTemplates.length > 0) {
        const template = availableTemplates[0];
        setHtmlContent(template.content);
        if (currentTask) {
          updateTask(currentTask.id, { htmlContent: template.content });
        }
        toast({
          title: "Template applied",
          description: `Applied template: ${template.name}`,
          duration: 3000,
        });
      }
    }
  };

  const handlePageTypeChange = (value: string) => {
    let mappedType: TaskType | undefined = undefined;
    if (value === TaskType.SUB_PAGE) mappedType = TaskType.SUB_PAGE;
    else if (value === TaskType.LANDING_PAGE) mappedType = TaskType.LANDING_PAGE;
    else if (value === TaskType.BLOG) mappedType = TaskType.BLOG;
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
    const selectedContent = view.state.doc.sliceString(selection.from, selection.to);
    // Special handling for link tag
    if (openTag.startsWith('<a ') && closeTag === '</a>') {
      setSelectedText(selectedContent); // Set the selected text before opening dialog
      setLinkDialogOpen(true);
      return;
    }
    if (selectedContent && closeTag) {
      // Wrap selected text
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: openTag + selectedContent + closeTag
        },
        selection: { anchor: selection.from + openTag.length + selectedContent.length + closeTag.length }
      });
      view.focus();
    } else {
      // Insert tag at cursor and move cursor after it
      view.dispatch({
        changes: { from: selection.from, to: selection.from, insert: openTag },
        selection: { anchor: selection.from + openTag.length }
      });
      view.focus();
    }
  };

  const handleInsertComponent = (html: string) => {
    const view = editorRef.current?.getView();
    if (!view) return;
    const selection = view.state.selection.main;
    const selectedContent = view.state.doc.sliceString(selection.from, selection.to);
    if (selectedContent) {
      // Wrap selection with the component/template
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: html
        },
        selection: { anchor: selection.from + html.length }
      });
      view.focus();
    } else {
      // Insert at cursor
      view.dispatch({
        changes: { from: selection.from, to: selection.from, insert: html },
        selection: { anchor: selection.from + html.length }
      });
      view.focus();
    }
  };


  // Add the useEffect here, at the top level
  useEffect(() => {
    if (!currentTask) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveChanges();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentTask, saveChanges]);

  // Download all images logic
  const handleDownloadAll = async () => {
    if (!images.length) return;
    setDownloading(true);
    try {
      for (const image of images) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = image.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      toast({
        title: 'Downloads started',
        description: 'Your images are being downloaded.',
      });
    } catch (error) {
      console.error('Error downloading images:', error);
      toast({
        title: 'Download failed',
        description: 'There was an error downloading your images.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  // Move this useEffect to the top level, outside of any conditionals
  useEffect(() => {
    if (!companyId || !currentTask) return;
    setTagsLoading(true);
    const unsub = subscribeToCompanyTags(companyId, (tags) => {
      setCompanyTags(tags);
      setTagsLoading(false);
    });
    return () => unsub();
  }, [companyId, currentTask]);

  // Unified handler for all checkmarks
  const handleCheckmarkChange = (field: string, checked: boolean) => {
    setCheckedFields(prev => {
      const updated = { ...prev, [field]: checked };
      if (currentTask) {
        // Only update checkedFields, never touch other fields
        updateTask(currentTask.id, { checkedFields: updated });
      }
      return updated;
    });
  };

  const handleLinkConfirm = (url: string) => {
    const view = editorRef.current?.getView();
    if (!view) return;
    const selection = view.state.selection.main;
    const selectedContent = view.state.doc.sliceString(selection.from, selection.to);
    const openTag = `<a href="${url}">`;
    const closeTag = "</a>";
    if (selectedContent) {
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: openTag + selectedContent + closeTag
        },
        selection: { anchor: selection.from + openTag.length + selectedContent.length + closeTag.length }
      });
      view.focus();
    } else {
      // Insert <a href="...">link text</a> at cursor
      const linkText = "link text";
      view.dispatch({
        changes: { from: selection.from, to: selection.from, insert: openTag + linkText + closeTag },
        selection: { anchor: selection.from + openTag.length, head: selection.from + openTag.length + linkText.length }
      });
      view.focus();
    }
  };

  // 1. Add a highlight handler
  const handleHighlight = () => {
    const view = editorRef.current?.getView();
    if (!view) return;
    const selection = view.state.selection.main;
    const selectedContent = view.state.doc.sliceString(selection.from, selection.to);
    if (selectedContent) {
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: `<mark>${selectedContent}</mark>`
        },
        selection: { anchor: selection.from + `<mark>`.length + selectedContent.length + `</mark>`.length }
      });
      view.focus();
    }
  };

  // Remove the useEffect from inside the if (currentTask) block
  if (tasksLoading) {
    return null;
  }

  // If currentTask is set, render the builder UI
  if (currentTask) {
    if (editorOnlyMode || isTinyMobile) {
      return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <EditorSection
            ref={editorRef}
            htmlContent={htmlContent}
            onHtmlChange={handleHtmlChange}
            onUpdate={() => {
              // Get the current editor view to extract selection info
              const view = editorRef.current?.getView();
              if (view) {
                const state = view.state;
                const selection = state.selection.main;
                setSelectedText(state.doc.sliceString(selection.from, selection.to));
                setCursorPosition({ from: selection.from, to: selection.to });
              }
            }}
            onSave={saveChanges}
            onToggleEditorOnlyMode={() => setEditorOnlyMode(false)}
            editorOnlyMode={true}
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
          />
        </div>
      );
    }
    
    // Images-only mode - show only Images section and Image Converter
    if (isImagesOnlyMode) {
      
      // Show loading state if task is not loaded yet
      if (!currentTask) {
        if (tasksLoading) {
          return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle,rgba(60,60,80,0.08)_1px,transparent_1px)] [background-size:32px_32px] backdrop-blur-[0.5px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg">Loading task...</p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle,rgba(60,60,80,0.08)_1px,transparent_1px)] [background-size:32px_32px] backdrop-blur-[0.5px]">
              <div className="text-center">
                <p className="text-lg mb-4">Task not found</p>
                <Button onClick={() => navigate('/')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          );
        }
      }
      
      return (
        <div className="min-h-screen w-full flex flex-col bg-background">
          <div className="max-w-6xl px-4 py-4 mx-auto flex-1 flex flex-col pb-8">
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline"
                onClick={() => navigate(`/builder/${currentTask.id}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Main Editor
              </Button>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-lg font-medium text-foreground">
                Images & Converter
              </h1>
            </div>
            
            {/* Images Section and Image Converter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Images Section */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Photos</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Downloaded</label>
                    <GreenCircleCheckbox
                      checked={!!checkedFields.photos}
                      onChange={e => handleCheckmarkChange('photos', e.target.checked)}
                      className="scale-110 shadow-lg hover:shadow-xl transition-all duration-200 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] hover:drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                      disabled={Object.keys(uploadingImages).length > 0}
                    >
                      {Object.keys(uploadingImages).length > 0 ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Upload Photos
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      onClick={handleDownloadAll}
                      disabled={!images.length || downloading}
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Download All
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      if (!e.target.files?.length || !currentTask?.id) return;
                      const files = Array.from(e.target.files);
                      
                      // Set loading state for all files
                      const loadingState: { [fileName: string]: boolean } = {};
                      files.forEach(file => {
                        loadingState[file.name] = true;
                      });
                      setUploadingImages(loadingState);
                      
                      // Import uploadImage function
                      const { uploadImage } = await import('@/utils/imageUpload');
                      
                      // Upload each file
                      for (const file of files) {
                        try {
                          const path = `tasks/${currentTask.id}`;
                          const result = await uploadImage(file, path);
                          
                          if (result.success && result.url) {
                            const newImage = {
                              url: result.url,
                              name: file.name,
                              size: file.size,
                              uploadedAt: new Date().toISOString(),
                            };
                            
                            // Update task with new image
                            const updatedImages = [...(currentTask.images || []), newImage];
                            await updateTask(currentTask.id, { images: updatedImages });
                            
                            toast({
                              title: "Image uploaded!",
                              description: `${file.name} has been uploaded successfully.`,
                            });
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast({
                            title: "Upload failed",
                            description: `Failed to upload ${file.name}`,
                            variant: "destructive",
                          });
                        } finally {
                          // Remove loading state for this file
                          setUploadingImages(prev => {
                            const newState = { ...prev };
                            delete newState[file.name];
                            return newState;
                          });
                        }
                      }
                      
                      // Clear the input
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  
                  {/* Magic Image List with URLs */}
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {/* Show uploading images */}
                    {Object.keys(uploadingImages).map((fileName) => (
                      <div key={`uploading-${fileName}`} className="flex items-center gap-4 p-3 bg-muted rounded-lg border border-blue-500">
                        {/* Loading placeholder */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-muted-foreground/20 rounded border flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                          </div>
                        </div>
                        
                        {/* Upload info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground truncate">
                              {fileName}
                            </span>
                            <span className="text-xs text-blue-500 font-medium">
                              Uploading...
                            </span>
                          </div>
                          
                          {/* Loading bar */}
                          <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show uploaded images */}
                    {images.length > 0 ? (
                      images.map((image, index) => {
                        // Extract filename from the image name
                        const filename = image.name.replace(/\.[^/.]+$/, ""); // Remove file extension
                        
                        // Generate the full URL using company settings
                        const generateImageUrl = (filename: string) => {
                          const company = getCompanyById(companyId);
                          if (!company) return '';
                          
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          
                          return `${company.basePath}${year}/${month}/${company.prefix}${filename}${company.fileSuffix}`;
                        };
                        
                        const fullUrl = generateImageUrl(filename);
                        
                        return (
                          <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg border">
                            {/* Image Thumbnail */}
                            <div className="flex-shrink-0">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            </div>
                            
                            {/* Image Info and URL */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {image.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({(image.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              
                              {/* Generated URL */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={fullUrl}
                                    readOnly
                                    className="w-full px-2 py-1 text-xs font-mono bg-background border border-border rounded text-blue-400 truncate"
                                  />
                                </div>
                                <CopyButton 
                                  value={fullUrl} 
                                  className="flex-shrink-0"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No images uploaded yet</p>
                        <p className="text-sm mt-1">Upload images to see them with their generated URLs</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Section */}
                  <div className="border-t pt-4">
                    <PhotoUploadPreview 
                      companyName={getCompanyById(companyId)?.name} 
                      pageType={pageType} 
                      taskId={currentTask?.id} 
                      onImagesChange={setImages}
                    />
                  </div>
                </div>
              </div>
              
              {/* Image Converter */}
              <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Image Converter</h2>
                <ImageFilenameConverter 
                  companyId={companyId} 
                  displayOutputAsText={true}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen w-full flex flex-col bg-background">
        <div className="max-w-full px-4 py-4 mx-auto flex-1 flex flex-col pb-8">
          {isMobile ? (
            <div className="mb-4 w-full">
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
                sidebarWidth={sidebarWidth}
                setSidebarWidth={setSidebarWidth}
                visible={sidebarVisible}
              />
            </div>
          ) : (
            <div
              className={`grid gap-4 ${!sidebarVisible ? 'grid-cols-1' : ''}`}
              style={!sidebarVisible ? { gridTemplateColumns: '1fr' } : { gridTemplateColumns: `${sidebarWidth}px 1fr` }}
            >
              {/* Left Sidebar: Back button + Tags/Components, sticky */}
              {sidebarVisible && (
                <div className="sticky top-4 h-[calc(100vh-2rem)] flex flex-col gap-4">
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
                      sidebarWidth={sidebarWidth}
                      setSidebarWidth={setSidebarWidth}
                      visible={sidebarVisible}
                    />
                  </div>
                </div>
              )}
              {/* Main Content: 3 columns, grouped cards as in wireframe, notes, and editor */}
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-1 web:grid-cols-3 gap-3 mb-2 editor-main-grid items-stretch">
                  {/* Row 1 */}
                  <div className="bg-card rounded-2xl shadow-lg border border-border p-4 flex flex-col h-full min-h-[320px]">
                    {/* Company Section */}
                    <CompanySection
                      companyId={companyId}
                      pageType={pageType}
                      teamworkLink={teamworkLink}
                      googleDocLink={googleDocLink}
                      onCompanyChange={handleCompanyChange}
                      onPageTypeChange={handlePageTypeChange}
                      onTeamworkLinkChange={handleTeamworkLinkChange}
                      onGoogleDocLinkChange={handleGoogleDocLinkChange}
                    />
                  </div>
                  <div className="flex flex-col h-full min-h-[320px]">
                    {/* HTML Templates */}
                    <div className="bg-card rounded-2xl shadow-lg border border-border p-4 flex flex-col h-full min-h-[320px]">
                      <ScrollArea className="flex-1">
                        <div>
                          <CompanyTemplateList
                            companyId={companyId}
                            pageType={pageType}
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
                                onBlur={e => setContactLink(e.target.value)}
                                className="font-mono text-xs flex-1 pl-3 rounded-md bg-card ml-2"
                                placeholder="Paste Contact Us link"
                              />
                              <CopyButton value={contactLink} />
                            </div>
                          </div>
                          {/* Image file name to link converter */}
                          <div className="mt-3">
                            <h3 className="text-lg font-medium mb-2">Image file name to link converter</h3>
                            <ImageFilenameConverter companyId={companyId} />
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl shadow-lg border border-border p-4 flex flex-col max-h-[400px] h-full min-h-[320px]">
                    {/* Featured IMG section */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="font-medium text-primary">Featured IMG</label>
                      </div>
                      <div className="relative flex items-center justify-center w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowFeaturedDropdown(v => !v)}
                          type="button"
                          className="w-48 justify-between"
                        >
                          {featuredImg ? (
                            <span
                              className="truncate overflow-hidden whitespace-nowrap max-w-[180px] inline-block"
                              title={currentTask?.images?.find(img => img.url === featuredImg)?.name || ''}
                            >
                              {currentTask?.images?.find(img => img.url === featuredImg)?.name || 'Select image'}
                            </span>
                          ) : 'Select image'}
                          <span className="ml-2">▼</span>
                        </Button>
                        {/* Dropdown popover */}
                        {showFeaturedDropdown && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-full z-10 mt-1 w-48 bg-background border border-border rounded shadow-lg">
                            <ul className="max-h-48 overflow-auto">
                              {(currentTask?.images || []).map(img => (
                                <li
                                  key={img.url}
                                  className={`px-3 py-2 cursor-pointer hover:bg-muted ${featuredImg === img.url ? 'bg-muted' : ''}`}
                                  onClick={() => {
                                    setFeaturedImg(img.url);
                                    setShowFeaturedDropdown(false);
                                    if (currentTask) {
                                      updateTask(currentTask.id, { featuredImg: img.url });
                                    }
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
                    <div className="flex flex-col items-center justify-center mt-3">
                      {featuredImg ? (
                        <img src={featuredImg} alt="Featured preview" className="max-h-24 max-w-24 rounded shadow border" />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center border rounded bg-muted text-muted-foreground">No image</div>
                      )}
                    </div>
                    {/* Title and ALT fields */}
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="w-12">Title:</span>
                        <Input
                          type="text"
                          value={featuredTitle}
                          onChange={e => handleFeaturedTitleChange(e.target.value)}
                          onBlur={e => handleFeaturedTitleChange(e.target.value)}
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
                          onChange={e => handleFeaturedAltChange(e.target.value)}
                          onBlur={e => handleFeaturedAltChange(e.target.value)}
                          className="flex-1"
                          placeholder="Enter alt text"
                        />
                        <CopyButton value={featuredAlt} />
                      </div>
                    </div>
                    {/* Featured Image Checkbox */}
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <label className="text-sm font-medium">Applied Featured Image</label>
                      <GreenCircleCheckbox
                        checked={!!checkedFields.featuredImg}
                        onChange={e => handleCheckmarkChange('featuredImg', e.target.checked)}
                        className="scale-110 shadow-lg hover:shadow-xl transition-all duration-200 drop-shadow-[0_0_6px_rgba(34,197,94,0.3)] hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="border border-border rounded-2xl p-4 shadow-lg bg-card min-h-[80px] flex flex-col justify-center bg-card">
                    {[
                      { label: 'Widget Title', key: 'widgetTitle', value: widgetTitle, handler: handleWidgetTitleChange },
                      { label: 'Meta Title', key: 'metaTitle', value: metaTitle, handler: handleMetaTitleChange },
                      { label: 'Meta URL', key: 'metaUrl', value: metaUrl, handler: handleMetaUrlChange },
                      { label: 'Meta Description', key: 'metaDescription', value: metaDescription, handler: handleMetaDescriptionChange },
                    ].map((item, idx) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-1 mb-2 last:mb-0 w-full">
                        <span className="w-full sm:w-28 text-xs sm:text-sm font-medium whitespace-nowrap truncate">{item.label}</span>
                        <div className="flex-1 flex flex-row gap-1 w-full">
                          <Input
                            type="text"
                            value={item.value}
                            onChange={e => item.handler(e.target.value)}
                            onBlur={e => item.handler(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border"
                            placeholder={item.label}
                          />
                          <CopyButton value={item.value} />
                        </div>
                      </div>
                    ))}
                    {/* Meta Info Checkbox */}
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <label className="text-sm font-medium">Applied Meta Info and Title</label>
                      <GreenCircleCheckbox
                        checked={!!checkedFields.widgetTitle}
                        onChange={e => handleCheckmarkChange('widgetTitle', e.target.checked)}
                        className="scale-110 shadow-lg hover:shadow-xl transition-all duration-200 drop-shadow-[0_0_6px_rgba(34,197,94,0.3)] hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                      />
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl shadow-lg border border-border p-4 flex flex-col max-h-[400px] col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">Photos</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Downloaded</label>
                        <GreenCircleCheckbox
                          checked={!!checkedFields.photos}
                          onChange={e => handleCheckmarkChange('photos', e.target.checked)}
                          className="mr-2 scale-110 shadow-lg hover:shadow-xl transition-all duration-200 drop-shadow-[0_0_6px_rgba(34,197,94,0.3)] hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                        />
                        <button
                          type="button"
                          className="px-3 py-1.5 text-sm text-foreground hover:text-blue-400 transition-colors border border-white hover:border-blue-400 rounded-md"
                          onClick={() => {
                            const imageTabUrl = `/task/${currentTask?.id}/images`;
                            window.open(imageTabUrl, '_blank');
                          }}
                          title="Open Images in New Tab"
                        >
                          Open in New Tab
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                        >
                          Upload Photos
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          onClick={handleDownloadAll}
                          disabled={!images.length || downloading}
                        >
                          {downloading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            'Download All'
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-auto h-full">
                      <PhotoUploadPreview 
                        companyName={getCompanyById(companyId)?.name} 
                        pageType={pageType} 
                        taskId={currentTask?.id} 
                        onImagesChange={setImages}
                      />
                    </div>
                  </div>
                </div>
                {/* HTML Editor always visible and fills remaining space */}
                <div className="flex-1 flex flex-col" ref={editorContainerRef}>
                  {/* Back to Dashboard and Task Finished Buttons */}
                  <div className="flex justify-between items-center my-2">
                    <Button 
                      variant="default"
                      onClick={async () => {
                        await saveChanges(); // Save all changes before navigating
                        navigate('/');
                      }}
                      className="bg-card text-foreground border-2 border-amber-600/30 shadow-lg hover:shadow-xl hover:bg-secondary hover:border-amber-600/50 transition-all duration-200 transform hover:scale-105 rounded-2xl"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-green-500 rounded-xl"
                      style={{ fontWeight: 600, letterSpacing: '0.01em' }}
                      onClick={() => {
                        setCompletionPopupOpen(true);
                      }}
                    >
                      Task finished 100% <span className="text-white">✓</span>
                    </Button>
                  </div>
                  <EditorSection
                    ref={editorRef}
                    htmlContent={htmlContent}
                    onHtmlChange={handleHtmlChange}
                    onUpdate={() => {
                      // Get the current editor view to extract selection info
                      const view = editorRef.current?.getView();
                      if (view) {
                        const state = view.state;
                        const selection = state.selection.main;
                        setSelectedText(state.doc.sliceString(selection.from, selection.to));
                        setCursorPosition({ from: selection.from, to: selection.to });
                      }
                    }}
                    onSave={saveChanges}
                    lastSavedAt={currentTask?.updatedAt ? new Date(currentTask.updatedAt) : null}
                    onToggleEditorOnlyMode={() => setEditorOnlyMode(v => !v)}
                    editorOnlyMode={editorOnlyMode}
                    sidebarVisible={sidebarVisible}
                    setSidebarVisible={setSidebarVisible}
                    onHighlight={handleHighlight}
                    highlightDisabled={!selectedText}
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
                    {/* Top-left cell: Tags link */}
                    <div className={`border-l-4 border-l-amber-600 border border-border rounded-2xl p-4 shadow-lg bg-card min-h-[80px] flex flex-col justify-center`}>
                      <h3 className="text-lg font-medium mb-2 text-center w-full text-primary">Tags link</h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-32">Review</span>
                          <Select value={reviewsTag} onValueChange={setReviewsTag} disabled={tagsLoading}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder={tagsLoading ? 'Loading...' : 'Select tag'} />
                            </SelectTrigger>
                            <SelectContent>
                              {(companyTags && companyTags.reviewTags && companyTags.reviewTags.length > 0)
                                ? companyTags.reviewTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                  ))
                                : <SelectItem value="no-tags" disabled>No tags</SelectItem>}
                            </SelectContent>
                          </Select>
                          <CopyButton value={reviewsTag} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-32">FAQ</span>
                          <Select value={faqTag} onValueChange={setFaqTag} disabled={tagsLoading}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder={tagsLoading ? 'Loading...' : 'Select tag'} />
                            </SelectTrigger>
                            <SelectContent>
                              {(companyTags && companyTags.faqTags && companyTags.faqTags.length > 0)
                                ? companyTags.faqTags.map(tag => (
                                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                  ))
                                : <SelectItem value="no-tags" disabled>No tags</SelectItem>}
                            </SelectContent>
                          </Select>
                          <CopyButton value={faqTag} />
                        </div>
                      </div>
                      {/* More info section */}
                      <div className="mt-6">
                        <h4 className="text-base font-semibold text-center text-primary mb-2">More info</h4>
                        <div className="bg-muted/30 border border-border rounded p-3 text-sm text-white/90 min-h-[60px]">
                          {getCompanyById(companyId)?.info ? (
                            <span>{getCompanyById(companyId)?.info}</span>
                          ) : (
                            <span className="text-muted-foreground">No info available for this company.</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Top-right cell: Google Maps Embed */}
                    <div id="maps-embed-section" className={`border-l-4 border-l-orange-600 border border-border rounded-2xl p-4 shadow-lg bg-card min-h-[80px] flex flex-col justify-between ${companyId && pageType === 'Blog' ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="mx-auto font-medium text-center w-full text-primary">Google Maps Embed</span>
                        <GreenCircleCheckbox
                          checked={!!checkedFields.maps}
                          onChange={e => handleCheckmarkChange('maps', e.target.checked)}
                          className="ml-2 scale-110 shadow-lg hover:shadow-xl transition-all duration-200 drop-shadow-[0_0_15px_rgba(34,197,94,0.7)] hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.9)]"
                        />
                      </div>
                      <label className="text-sm mb-1">Enter a City, ST:</label>
                      <Input
                        type="text"
                        value={mapsLocation}
                        onChange={e => handleMapsLocationChange(e.target.value)}
                        onBlur={e => handleMapsLocationChange(e.target.value)}
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
                          onChange={e => handleMapsEmbedCodeChange(e.target.value)}
                          onBlur={e => handleMapsEmbedCodeChange(e.target.value)}
                          placeholder="Paste your iframe code here..."
                          className="flex-1"
                        />
                        <CopyButton value={mapsEmbedCode} />
                      </div>
                    </div>
                    {/* Bottom-left cell: Instructions to Link */}
                    <div className="border-l-4 border-l-emerald-600 border border-border rounded-2xl p-4 shadow-lg bg-card min-h-[80px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="mx-auto font-medium text-center w-full text-primary">Important Steps</span>
                        <GreenCircleCheckbox
                          checked={!!checkedFields.instructions}
                          onChange={e => handleCheckmarkChange('instructions', e.target.checked)}
                          className="ml-2 scale-110 shadow-lg hover:shadow-xl transition-all duration-200 drop-shadow-[0_0_15px_rgba(34,197,94,0.7)] hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.9)]"
                        />
                      </div>
                      <Textarea
                        className="rounded-xl border border-border p-2 mt-2 flex-1 resize-none text-lg bg-secondary"
                        rows={4}
                        value={instructionsToLink}
                        onChange={e => handleTextChange('instructionsToLink', e.target.value)}
                        onBlur={e => handleTextChange('instructionsToLink', e.target.value)}
                        placeholder={pageType === 'Blog' ? "Don't forget to select at least 2 categories for Blog Post! Schedule to post two days after the last blog post." : pageType === 'Landing Page' ? "Don't forget to go to \"Sorting\", and put in right group in alphabetical order if needed" : "Link this new sub page to a relevant keyword on the parent Landing page."}
                      />
                    </div>
                    {/* Bottom-right cell: Notes */}
                    <div className="border-l-4 border-l-violet-600 border border-border rounded-2xl p-4 shadow-lg bg-card min-h-[80px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="mx-auto font-medium text-center w-full text-primary">Notes</span>
                      </div>
                      <Textarea
                        className="rounded-xl border border-border p-2 mt-2 flex-1 resize-none bg-secondary"
                        rows={4}
                        value={notes}
                        onChange={e => handleTextChange('notes', e.target.value)}
                        onBlur={e => handleTextChange('notes', e.target.value)}
                        placeholder="Enter notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Main content rendering here, outside sidebar logic */}
        </div>
        {/* Help button at the bottom right, not floating */}
        <div className="w-full flex justify-end mt-4 mb-4">
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="lg" className="px-8 py-2 text-lg font-semibold rounded-2xl shadow-lg mx-4 my-1">
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
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Saving changes...
          </div>
        )}
        {saveError && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
            {saveError}
          </div>
        )}
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          onConfirm={handleLinkConfirm}
          selectedText={selectedText}
        />
        
        {/* Task Completion Popup */}
        <Dialog open={completionPopupOpen} onOpenChange={setCompletionPopupOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">Task Completion Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                {/* Only show Google Maps for Landing Page and Sub Page */}
                {pageType !== 'Blog' && (
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                    onClick={() => handleCheckmarkChange('maps', !checkedFields.maps)}
                  >
                    <span className="font-medium">Google Maps Embed</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${checkedFields.maps ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {checkedFields.maps && <span className="text-white text-sm">✓</span>}
                    </div>
                  </div>
                )}
                
                {/* Always show these for all page types */}
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                  onClick={() => handleCheckmarkChange('featuredImg', !checkedFields.featuredImg)}
                >
                  <span className="font-medium">Featured Image</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${checkedFields.featuredImg ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {checkedFields.featuredImg && <span className="text-white text-sm">✓</span>}
                  </div>
                </div>
                
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                  onClick={() => handleCheckmarkChange('photos', !checkedFields.photos)}
                >
                  <span className="font-medium">Photos Downloaded</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${checkedFields.photos ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {checkedFields.photos && <span className="text-white text-sm">✓</span>}
                  </div>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 rounded transition-colors"
                  onClick={() => handleCheckmarkChange('widgetTitle', !checkedFields.widgetTitle)}
                >
                  <span className="font-medium">Widget Title and Meta info</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${checkedFields.widgetTitle ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {checkedFields.widgetTitle && <span className="text-white text-sm">✓</span>}
                  </div>
                </div>
                
                {/* Important Steps - Always visible at the end */}
                <div className="border border-border rounded-2xl bg-card shadow-lg">
                  <div 
                    className="flex items-center justify-between cursor-pointer p-3 rounded-t-lg transition-colors"
                    onClick={() => handleCheckmarkChange('instructions', !checkedFields.instructions)}
                  >
                    <span className="font-medium text-white">Important Steps</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${checkedFields.instructions ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {checkedFields.instructions && <span className="text-white text-sm">✓</span>}
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="bg-secondary rounded-xl p-4 text-sm border border-border shadow-sm">
                      <div className="font-semibold mb-2 text-foreground flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        Current Instructions:
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                        {instructionsToLink || (pageType === 'Blog' ? "Don't forget to select at least 2 categories for Blog Post! Schedule to post two days after the last blog post." : pageType === 'Landing Page' ? "Don't forget to go to \"Sorting\", and put in right group in alphabetical order if needed" : pageType === 'Sub Page' ? "Link this new sub page to a relevant keyword on the parent Landing page." : "Enter instructions...")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCompletionPopupOpen(false)}
                >
                  Go Edit
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={(() => {
                    // Check all required fields based on page type
                    const requiredFields = pageType === 'Blog' 
                      ? ['featuredImg', 'instructions', 'photos', 'widgetTitle']
                      : ['maps', 'featuredImg', 'instructions', 'photos', 'widgetTitle'];
                    
                    return !requiredFields.every(field => checkedFields[field as keyof typeof checkedFields]);
                  })()}
                  onClick={() => {
                    if (currentTask) {
                      updateTask(currentTask.id, { status: TaskStatus.FINISHED });
                      toast({
                        title: "Task Completed! 🎉",
                        description: "Task has been moved to 'Posted Live' status",
                        duration: 5000,
                      });
                    }
                    setCompletionPopupOpen(false);
                  }}
                >
                  Mark as Completed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If tasks are loaded and the task is not found, redirect will have already happened
  return null;
};

export default HtmlBuilder;
