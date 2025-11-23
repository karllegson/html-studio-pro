import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { sortImagesByHtmlOrder } from '@/utils/imageSorting';
import { GoogleDocImportModal } from '@/components/html-builder/GoogleDocImportModal';
import { ParsedImageInfo } from '@/utils/googleDocParser';
import { matchImageMetadata } from '@/utils/imageMatching';
import { extractImageNumbers } from '@/utils/imageNumbering';

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
  const imagesTabFileInputRef = useRef<HTMLInputElement>(null);

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
  const [googleDocImportOpen, setGoogleDocImportOpen] = useState(false);
  const [googleDocPastedContent, setGoogleDocPastedContent] = useState('');
  const [googleDocParsedImages, setGoogleDocParsedImages] = useState<ParsedImageInfo[]>([]);

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [editorOnlyMode, setEditorOnlyMode] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Copy button click tracking (local state only)
  const [copyClickOrder, setCopyClickOrder] = useState<{ [buttonId: string]: number }>({});
  const [copyClickCounter, setCopyClickCounter] = useState(0);

  // Image reordering toggle
  const [reorderByHtml, setReorderByHtml] = useState(true);
  
  // Track image hrefs import state for undo
  const [hrefsImported, setHrefsImported] = useState(false);
  const [htmlBeforeImport, setHtmlBeforeImport] = useState('');
  
  // Featured image selection modal
  const [featuredImgModalOpen, setFeaturedImgModalOpen] = useState(false);

  const handleCopyClick = (buttonId: string) => {
    if (!copyClickOrder[buttonId]) {
      setCopyClickOrder(prev => ({
        ...prev,
        [buttonId]: copyClickCounter + 1
      }));
      setCopyClickCounter(prev => prev + 1);
    }
  };

  const handleResetClick = (buttonId: string) => {
    // Remove this button from the tracking
    setCopyClickOrder(prev => {
      const newOrder = { ...prev };
      delete newOrder[buttonId];
      return newOrder;
    });
  };

  // Auto-check section checkboxes when all copy buttons in that section are clicked
  useEffect(() => {
    // Define sections and their required copy buttons
    const sectionMappings = {
      featuredImg: ['featuredTitle', 'featuredAlt'],
      widgetTitle: ['widgetTitle', 'metaTitle', 'metaUrl', 'metaDescription'],
      maps: ['mapsEmbedCode'],
      photos: ['downloadAll']
    };

    // Check each section
    Object.entries(sectionMappings).forEach(([checkboxKey, requiredButtons]) => {
      const allButtonsClicked = requiredButtons.every(buttonId => copyClickOrder[buttonId]);
      
      // If all buttons in section are clicked and checkbox is not checked, check it
      if (allButtonsClicked && !checkedFields[checkboxKey]) {
        handleCheckmarkChange(checkboxKey, true);
      }
      // If any button is un-clicked and checkbox is checked, uncheck it
      else if (!allButtonsClicked && checkedFields[checkboxKey]) {
        handleCheckmarkChange(checkboxKey, false);
      }
    });
  }, [copyClickOrder]); // Run whenever copy button state changes

  // Version history state (max 4 versions including current)
  interface Version {
    content: string;
    timestamp: Date;
    isCurrent: boolean;
  }
  const [versionHistory, setVersionHistory] = useState<Version[]>([]);
  const [viewingVersionIndex, setViewingVersionIndex] = useState<number | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [currentHtmlContent, setCurrentHtmlContent] = useState(''); // Store the actual current content

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

  // Direct update handlers for each field (with leading space trimming)
  const handleFeaturedTitleChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setFeaturedTitle(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { featuredTitle: trimmedValue });
    }
  };

  const handleFeaturedAltChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setFeaturedAlt(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { featuredAlt: trimmedValue });
    }
  };

  const handleWidgetTitleChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setWidgetTitle(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { widgetTitle: trimmedValue });
    }
  };

  const handleMetaTitleChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setMetaTitle(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { metaTitle: trimmedValue });
    }
  };

  const handleMetaUrlChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setMetaUrl(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { metaUrl: trimmedValue });
    }
  };

  const handleMetaDescriptionChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setMetaDescription(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { metaDescription: trimmedValue });
    }
  };

  const handleMapsLocationChange = (value: string) => {
    const trimmedValue = value.trimStart(); // Remove leading spaces only
    setMapsLocation(trimmedValue);
    if (currentTask) {
      updateTask(currentTask.id, { mapsLocation: trimmedValue });
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

  // Handle importing image info from Google Doc
  const handleApplyImageMetadata = (parsedImages: ParsedImageInfo[]) => {
    if (!currentTask || parsedImages.length === 0) return;

    // Check if images are uploaded
    if (images.length === 0) {
      toast({
        title: 'No images uploaded',
        description: 'Please upload images first before importing metadata',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Match parsed metadata with uploaded images
      const mappings = matchImageMetadata(images, parsedImages, htmlContent);

      console.log('Image Mappings:', mappings);

      // Create a new ordered array based on mappings
      const reorderedImages: TaskImage[] = [];
      let featuredImageUrl: string | null = null;
      let featuredAltText: string | null = null;
      let featuredTitleText: string | null = null;
      let featuredImageWithMetadata: TaskImage | null = null;
      
      // Separate featured from non-featured mappings
      const featuredMapping = mappings.find(m => m.matchType === 'featured');
      const nonFeaturedMappings = mappings.filter(m => m.matchType !== 'featured');
      
      // Process non-featured images in order of parsed metadata
      nonFeaturedMappings.forEach(mapping => {
        const { imageIndex, metadata } = mapping;
        
        if (imageIndex >= 0 && imageIndex < images.length) {
          const imageWithMetadata = {
            ...images[imageIndex],
            alt: metadata.altText || images[imageIndex].alt,
            title: metadata.searchTitle || images[imageIndex].title,
            googleDocOrder: metadata.order // Store Google Doc order
          };
          reorderedImages.push(imageWithMetadata);
        }
      });
      
      // Process featured image
      if (featuredMapping) {
        const { imageIndex, metadata } = featuredMapping;
        
        if (imageIndex >= 0 && imageIndex < images.length) {
          featuredImageWithMetadata = {
            ...images[imageIndex],
            alt: metadata.altText || images[imageIndex].alt,
            title: metadata.searchTitle || images[imageIndex].title,
            googleDocOrder: metadata.order // Store Google Doc order (will be 1)
          };
          
          featuredImageUrl = featuredImageWithMetadata.url;
          featuredAltText = metadata.altText || null;
          featuredTitleText = metadata.searchTitle || null;
          
          console.log('Setting featured image:', {
            url: featuredImageUrl,
            alt: featuredAltText,
            title: featuredTitleText
          });
          
          // Add featured image at the END
          reorderedImages.push(featuredImageWithMetadata);
        }
      }
      
      // Add any remaining images that weren't matched
      const usedIndices = new Set(mappings.map(m => m.imageIndex));
      images.forEach((img, index) => {
        if (!usedIndices.has(index)) {
          reorderedImages.push(img);
        }
      });

      console.log('Reordered images array:', reorderedImages.map(img => img.name));

      // Update images state with reordered array
      setImages(reorderedImages);

      // Update featured image states if found
      if (featuredImageUrl) {
        setFeaturedImg(featuredImageUrl);
        if (featuredAltText) {
          setFeaturedAlt(featuredAltText);
        }
        if (featuredTitleText) {
          setFeaturedTitle(featuredTitleText);
        }
      }

      // Save to Firestore
      if (currentTask) {
        const updateData: any = { 
          images: reorderedImages,
        };

        if (featuredImageUrl) {
          updateData.featuredImg = featuredImageUrl;
        }
        if (featuredAltText) {
          updateData.featuredAlt = featuredAltText;
        }
        if (featuredTitleText) {
          updateData.featuredTitle = featuredTitleText;
        }

        updateTask(currentTask.id, updateData);
      }

      toast({
        title: 'Image metadata applied',
        description: `Successfully applied metadata to ${mappings.length} image(s)${featuredImageUrl ? ' and set featured image' : ''}`,
      });
    } catch (error) {
      console.error('Error applying image metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply image metadata',
        variant: 'destructive'
      });
    }
  };

  // Handle importing/undoing image hrefs
  const handleToggleImageHrefs = () => {
    if (hrefsImported) {
      // Undo: restore original HTML
      setHtmlContent(htmlBeforeImport);
      if (currentTask) updateTask(currentTask.id, { htmlContent: htmlBeforeImport });
      setHrefsImported(false);
      setHtmlBeforeImport('');
      toast({ title: 'Import undone', description: 'Restored original src numbers' });
    } else {
      // Import hrefs
      if (!companyId || images.length === 0 || !htmlContent.trim()) return;

      const company = getCompanyById(companyId);
      if (!company) return;

      // Save current HTML for undo
      setHtmlBeforeImport(htmlContent);

      const nonFeaturedImages = images.filter(img => img.url !== featuredImg);
      let updatedHtml = htmlContent;
      let imageIndex = 0;

      // Replace numbered src (src="1", src="2", etc.)
      nonFeaturedImages.forEach((image, index) => {
        const srcNumber = index + 1;
        const filename = image.name.replace(/\.[^/.]+$/, '').replace(/-\d+x\d+$/, '');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const url = `${company.basePath}${year}/${month}/${company.prefix}${filename}${company.fileSuffix}`;
        
        updatedHtml = updatedHtml.replace(new RegExp(`src=["']${srcNumber}["']`, 'gi'), `src="${url}"`);
      });

      // Also replace empty src (src="" or src='')
      updatedHtml = updatedHtml.replace(/(<img[^>]*?)src=["']["']/gi, (match) => {
        if (imageIndex < nonFeaturedImages.length) {
          const image = nonFeaturedImages[imageIndex];
          const filename = image.name.replace(/\.[^/.]+$/, '').replace(/-\d+x\d+$/, '');
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const url = `${company.basePath}${year}/${month}/${company.prefix}${filename}${company.fileSuffix}`;
          imageIndex++;
          return match.replace(/src=["']["']/, `src="${url}"`);
        }
        return match;
      });

      setHtmlContent(updatedHtml);
      if (currentTask) updateTask(currentTask.id, { htmlContent: updatedHtml });
      setHrefsImported(true);
      toast({ title: 'Image hrefs imported', description: `Updated ${nonFeaturedImages.length} image src attributes` });
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
        const trimmedInstructions = value.trimStart(); // Remove leading spaces only
        setInstructionsToLink(trimmedInstructions);
        if (currentTask) {
          updateTask(currentTask.id, { instructionsToLink: trimmedInstructions });
        }
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

  // Sync htmlContent when it changes from external updates (e.g., Import Hrefs from Preview page)
  useEffect(() => {
    if (!currentTask || !htmlContent) return;
    
    // Check if currentTask.htmlContent is different from local state
    if (currentTask.htmlContent && currentTask.htmlContent !== htmlContent) {
      // Always sync if the content is different and not caused by local typing
      // Simple check: if content changed and we haven't manually edited recently
      setHtmlContent(currentTask.htmlContent);
      console.log('HTML synced from Firestore update');
    }
  }, [currentTask?.htmlContent]);

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

  // Handle error position from query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const errorPos = searchParams.get('errorPos');
    
    if (errorPos && htmlContent && editorRef.current) {
      const position = parseInt(errorPos, 10);
      if (!isNaN(position) && position >= 0 && position <= htmlContent.length) {
        // Wait a bit for editor to be ready
        setTimeout(async () => {
          const view = editorRef.current?.getView();
          if (view) {
            try {
              // Import CodeMirror modules
              const { EditorSelection } = await import('@codemirror/state');
              const { EditorView } = await import('@codemirror/view');
              
              // Ensure position is within document bounds
              const docLength = view.state.doc.length;
              const safePosition = Math.min(Math.max(0, position), docLength - 1);
              
              console.log('Navigating to error position:', safePosition, 'of', docLength);
              
              // Get the line containing the error position
              // Use lineAt with a position that's guaranteed to be within a line
              let line;
              try {
                line = view.state.doc.lineAt(safePosition);
              } catch (e) {
                // If position is at the very end, get the last line
                const lastLine = view.state.doc.line(view.state.doc.lines);
                line = lastLine;
              }
              
              const lineStart = line.from;
              const lineEnd = line.to;
              const lineText = view.state.doc.sliceString(lineStart, lineEnd);
              const positionInLine = safePosition - lineStart;
              
              console.log('Line info:', { lineStart, lineEnd, positionInLine, lineText: lineText.substring(0, 50) });
              
              // The position from validation is at the start of the tag (the '<' character)
              // Find the end of the tag by looking for '>'
              let tagStart = safePosition;
              let tagEnd = safePosition;
              
              // Verify we're at a '<' or find it nearby
              if (positionInLine >= 0 && positionInLine < lineText.length) {
                if (lineText[positionInLine] === '<') {
                  tagStart = safePosition;
                } else {
                  // Look backwards for '<'
                  for (let i = Math.min(positionInLine, lineText.length - 1); i >= 0; i--) {
                    if (lineText[i] === '<') {
                      tagStart = lineStart + i;
                      break;
                    }
                  }
                }
                
                // Look forwards for '>' to find the end of the tag
                const searchStart = tagStart - lineStart;
                for (let i = searchStart; i < lineText.length; i++) {
                  if (lineText[i] === '>') {
                    tagEnd = lineStart + i + 1; // Include the '>'
                    break;
                  }
                }
              }
              
              // If we didn't find a complete tag, select a reasonable range
              if (tagEnd <= tagStart) {
                tagEnd = Math.min(lineEnd, tagStart + 30);
              }
              
              console.log('Tag bounds:', { tagStart, tagEnd, scrollPos: tagStart });
              
              // Select the tag (or a range around the position)
              const selectStart = Math.max(lineStart, tagStart);
              const selectEnd = Math.min(lineEnd, tagEnd);
              
              // Select and scroll to the error location
              const highlightTransaction = view.state.update({
                selection: EditorSelection.range(selectStart, selectEnd),
                effects: EditorView.scrollIntoView(tagStart, { y: 'center' })
              });
              view.dispatch(highlightTransaction);
              
              // Focus the editor
              view.focus();
              
              // Remove the query parameter after handling
              const newSearch = new URLSearchParams(location.search);
              newSearch.delete('errorPos');
              navigate(`${location.pathname}${newSearch.toString() ? '?' + newSearch.toString() : ''}`, { replace: true });
              
              toast({
                title: "Error location highlighted",
                description: "The error location has been highlighted in the editor.",
                duration: 3000
              });
            } catch (error) {
              console.error('Error scrolling to position:', error);
              console.error('Position:', position, 'HTML length:', htmlContent.length);
            }
          }
        }, 800); // Increased timeout to ensure editor is fully ready
      }
    }
  }, [location.search, htmlContent, navigate, location.pathname, toast]);

  // Save HTML code version to history (max 4 versions) and persist to Firestore
  const saveVersionToHistory = useCallback(async (htmlCode: string, taskId: string) => {
    return new Promise<void>((resolve) => {
      // Update local state first, then save to Firestore
      setVersionHistory(prev => {
        // Check if this is the same as the last version (avoid duplicates)
        if (prev.length > 0 && prev[prev.length - 1].content === htmlCode) {
          resolve(); // Don't add duplicate
          return prev;
        }
        
        // Mark all previous versions as not current
        const updated = prev.map(v => ({ ...v, isCurrent: false }));
        
        // Add new HTML code version as current
        const newVersion: Version = {
          content: htmlCode, // Only HTML code
          timestamp: new Date(),
          isCurrent: true
        };
        
        // Keep only the last 3 versions (plus the new one = 4 total)
        const limited = [...updated.slice(-3), newVersion];
        
        // Convert to Firestore format (Date to ISO string) and save to database
        const firestoreHistory = limited.map(v => ({
          content: v.content,
          timestamp: v.timestamp.toISOString(),
          isCurrent: v.isCurrent
        }));

        // Save to Firestore
        updateTask(taskId, { htmlVersionHistory: firestoreHistory }).then(() => {
          resolve();
        }).catch(error => {
          console.error('Failed to save version history to database:', error);
          resolve(); // Resolve anyway - version history is not critical
        });
        
        return limited;
      });
    }).then(() => {
      // Update current HTML content and reset viewing index when saving new version
      setCurrentHtmlContent(htmlCode);
      setViewingVersionIndex(null);
    });
  }, [updateTask]);

  // Handle version selection
  const handleVersionSelect = useCallback((index: number) => {
    if (index === versionHistory.length - 1) {
      // Clicking on current version - restore to actual current content
      setHtmlContent(currentHtmlContent);
      setViewingVersionIndex(null);
    } else {
      // Viewing a previous version
      setHtmlContent(versionHistory[index].content);
      setViewingVersionIndex(index);
    }
  }, [versionHistory, currentHtmlContent]);

  // Initialize current content and load version history from Firestore when task loads
  useEffect(() => {
    if (currentTask?.htmlContent) {
      setCurrentHtmlContent(currentTask.htmlContent);
      
      // Load version history from Firestore if available
      if (currentTask.htmlVersionHistory && currentTask.htmlVersionHistory.length > 0) {
        const loadedHistory: Version[] = currentTask.htmlVersionHistory.map(v => ({
          content: v.content,
          timestamp: new Date(v.timestamp),
          isCurrent: v.isCurrent
        }));
        setVersionHistory(loadedHistory);
      } else {
        // Initialize with current version if no history exists
        setVersionHistory([{
          content: currentTask.htmlContent,
          timestamp: new Date(currentTask.updatedAt || Date.now()),
          isCurrent: true
        }]);
      }
    }
  }, [currentTask?.htmlContent, currentTask?.updatedAt, currentTask?.htmlVersionHistory]);

  // Save all changes (used for HTML editor and manual saves)
  const saveChanges = async () => {
    if (currentTask?.id) {
      setSaving(true);
      try {
        // Save current HTML CODE to version history in Firestore before saving (ONLY HTML CODE)
        await saveVersionToHistory(htmlContent, currentTask.id);
        
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
        // For blog posts, check if company has its own templates first
        const companyTemplates = getTemplatesByCompany(value);
        const companyBlogTemplates = companyTemplates.filter(template => 
          template.pageType === TaskType.BLOG && template.isActive
        );
        
        // If company has blog templates, use those. Otherwise, use generic templates
        if (companyBlogTemplates.length > 0) {
          availableTemplates = companyBlogTemplates;
        } else {
          availableTemplates = getBlogTemplatesFromAllCompanies();
        }
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
            onToggleImageHrefs={handleToggleImageHrefs}
            hrefsImported={hrefsImported}
            imagesUploaded={images.length > 0}
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
                  <div className="flex gap-4 flex-wrap">
                    <button
                      type="button"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                      onClick={() => imagesTabFileInputRef.current?.click()}
                      disabled={Object.keys(uploadingImages).length > 0}
                    >
                      {Object.keys(uploadingImages).length > 0 ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Upload Photos</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap ${
                        copyClickOrder['downloadAll'] 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      onClick={() => {
                        if (copyClickOrder['downloadAll']) {
                          handleResetClick('downloadAll');
                        } else {
                          handleDownloadAll();
                          handleCopyClick('downloadAll');
                        }
                      }}
                      disabled={!images.length || downloading}
                      title={copyClickOrder['downloadAll'] ? 'Click to reset' : 'Download all images'}
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 flex-shrink-0" />
                          <span>Download All</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`px-6 py-2.5 rounded-lg inline-flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap ${
                        reorderByHtml 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      onClick={() => setReorderByHtml(!reorderByHtml)}
                      title={reorderByHtml ? 'Images sorted by HTML order' : 'Images in upload order'}
                    >
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      <span>{reorderByHtml ? '✓ Sorted by HTML' : 'Sort by HTML'}</span>
                    </button>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={imagesTabFileInputRef}
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
                      
                      // Upload all files in parallel
                      const uploadPromises = files.map(async (file) => {
                        try {
                          const path = `tasks/${currentTask.id}`;
                          const result = await uploadImage(file, path);
                          
                          if (result.success && result.url) {
                            return {
                              url: result.url,
                              name: file.name,
                              size: file.size,
                              uploadedAt: new Date().toISOString(),
                            };
                          } else {
                            toast({
                              title: "Upload failed",
                              description: `Failed to upload ${file.name}`,
                              variant: "destructive",
                            });
                            return null;
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast({
                            title: "Upload failed",
                            description: `Failed to upload ${file.name}`,
                            variant: "destructive",
                          });
                          return null;
                        } finally {
                          // Remove loading state for this file
                          setUploadingImages(prev => {
                            const newState = { ...prev };
                            delete newState[file.name];
                            return newState;
                          });
                        }
                      });
                      
                      // Wait for all uploads to complete
                      const uploadedImages = await Promise.all(uploadPromises);
                      const successfulUploads = uploadedImages.filter((img): img is NonNullable<typeof img> => img !== null);
                      
                      // Update task with all new images at once
                      if (successfulUploads.length > 0) {
                        const updatedImages = [...(currentTask.images || []), ...successfulUploads];
                        await updateTask(currentTask.id, { images: updatedImages });
                        
                        toast({
                          title: "Uploads complete!",
                          description: `${successfulUploads.length} image(s) uploaded successfully.`,
                        });
                      }
                      
                      // Clear the input
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  
                  {/* Magic Image List with URLs */}
                  <div className="space-y-3">
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
                    {(() => {
                      // Sort images by HTML order when in images-only mode AND toggle is on
                      const sortedImages = isImagesOnlyMode && htmlContent && reorderByHtml
                        ? sortImagesByHtmlOrder(htmlContent, images, featuredImg)
                        : images;
                      
                      return sortedImages.length > 0 ? (
                        sortedImages.map((image, index) => {
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
                        const isFeaturedImage = featuredImg && image.url === featuredImg;
                        
                        // Determine image number for non-featured images (always show if HTML has src numbers)
                        let imageNumber: number | null = null;
                        if (!isFeaturedImage && htmlContent) {
                          // Extract HTML src numbers
                          const htmlSrcNumbers = extractImageNumbers(htmlContent);
                          
                          // Only show numbers if HTML actually has src numbers
                          if (htmlSrcNumbers.length > 0) {
                            // Find the index of this image in sortedImages (excluding featured)
                            const nonFeaturedSorted = sortedImages.filter(img => !(featuredImg && img.url === featuredImg));
                            const positionInSorted = nonFeaturedSorted.findIndex(img => img.url === image.url);
                            
                            // Map position to HTML src number
                            if (positionInSorted >= 0 && positionInSorted < htmlSrcNumbers.length) {
                              imageNumber = htmlSrcNumbers[positionInSorted];
                            }
                          }
                        }
                        
                        return (
                          <div key={`${image.url}-${index}`} className={`flex items-center gap-6 p-5 bg-muted rounded-lg border hover:border-blue-500 transition-colors ${isFeaturedImage ? 'border-green-500 border-2' : ''}`}>
                            {/* Image Thumbnail */}
                            <div className="flex-shrink-0 relative">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-md"
                                onClick={() => window.open(image.url, '_blank')}
                                title="Click to view full size"
                              />
                            </div>
                            
                            {/* Image Info and URL */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {imageNumber !== null && (
                                  <span className="text-lg font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                    HTML: #{imageNumber}
                                  </span>
                                )}
                                {image.googleDocOrder && (
                                  <span className="text-lg font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                    {isFeaturedImage ? 'Featured' : `Doc: #${image.googleDocOrder - 1}`}
                                  </span>
                                )}
                                {/* Match indicator - only show if both HTML and Google Doc data exist */}
                                {imageNumber !== null && image.googleDocOrder && !isFeaturedImage && (
                                  <>
                                    {imageNumber === (image.googleDocOrder - 1) ? (
                                      <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                                        ✓ Match
                                      </span>
                                    ) : (
                                      <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded flex items-center gap-1">
                                        ⚠ Mismatch
                                      </span>
                                    )}
                                  </>
                                )}
                                {isFeaturedImage && (
                                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                    Featured Image
                                  </span>
                                )}
                                <span className="text-base font-medium text-foreground truncate">
                                  {image.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
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
                                  clickOrder={copyClickOrder[`fullUrl-${index}`] || null}
                                  onCopyClick={() => handleCopyClick(`fullUrl-${index}`)}
                                  onResetClick={() => handleResetClick(`fullUrl-${index}`)}
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
                    );
                    })()}
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
                onToggleImageHrefs={handleToggleImageHrefs}
                hrefsImported={hrefsImported}
                imagesUploaded={images.length > 0}
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
                      onToggleImageHrefs={handleToggleImageHrefs}
                      hrefsImported={hrefsImported}
                      imagesUploaded={images.length > 0}
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
                      onImportImageInfo={() => setGoogleDocImportOpen(true)}
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
                              <CopyButton 
                                value={contactLink}
                                clickOrder={copyClickOrder['contactLink'] || null}
                                onCopyClick={() => handleCopyClick('contactLink')}
                                onResetClick={() => handleResetClick('contactLink')}
                              />
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
                          onClick={() => setFeaturedImgModalOpen(true)}
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
                          <span className="ml-2">🖼️</span>
                        </Button>
                        
                        {/* Featured Image Selection Modal */}
                        <Dialog open={featuredImgModalOpen} onOpenChange={setFeaturedImgModalOpen}>
                          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Select Featured Image</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto max-h-[calc(85vh-8rem)] pr-2">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
                                {(currentTask?.images || []).map(img => (
                                  <div
                                    key={img.url}
                                    className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all hover:scale-105 ${
                                      featuredImg === img.url 
                                        ? 'border-green-500 ring-4 ring-green-300' 
                                        : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      setFeaturedImg(img.url);
                                      if (currentTask) {
                                        updateTask(currentTask.id, { featuredImg: img.url });
                                      }
                                      setFeaturedImgModalOpen(false);
                                    }}
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="w-full h-48 object-cover"
                                    />
                                    {featuredImg === img.url && (
                                      <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-2 shadow-lg">
                                        <Check className="h-5 w-5" />
                                      </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs truncate">
                                      {img.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
                          onPaste={e => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            handleFeaturedTitleChange(pastedText.trimStart());
                          }}
                          className="flex-1"
                          placeholder="Enter title"
                        />
                        <CopyButton 
                          value={featuredTitle}
                          clickOrder={copyClickOrder['featuredTitle'] || null}
                          onCopyClick={() => handleCopyClick('featuredTitle')}
                          onResetClick={() => handleResetClick('featuredTitle')}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12">ALT:</span>
                        <Input
                          type="text"
                          value={featuredAlt}
                          onChange={e => handleFeaturedAltChange(e.target.value)}
                          onBlur={e => handleFeaturedAltChange(e.target.value)}
                          onPaste={e => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            handleFeaturedAltChange(pastedText.trimStart());
                          }}
                          className="flex-1"
                          placeholder="Enter alt text"
                        />
                        <CopyButton 
                          value={featuredAlt}
                          clickOrder={copyClickOrder['featuredAlt'] || null}
                          onCopyClick={() => handleCopyClick('featuredAlt')}
                          onResetClick={() => handleResetClick('featuredAlt')}
                        />
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
                            onPaste={e => {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text');
                              item.handler(pastedText.trimStart());
                            }}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-md border"
                            placeholder={item.label}
                          />
                          <CopyButton 
                            value={item.value}
                            clickOrder={copyClickOrder[item.key] || null}
                            onCopyClick={() => handleCopyClick(item.key)}
                            onResetClick={() => handleResetClick(item.key)}
                          />
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
                          className={`px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${
                            copyClickOrder['downloadAll'] 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          onClick={() => {
                            if (copyClickOrder['downloadAll']) {
                              handleResetClick('downloadAll');
                            } else {
                              handleDownloadAll();
                              handleCopyClick('downloadAll');
                            }
                          }}
                          disabled={!images.length || downloading}
                          title={copyClickOrder['downloadAll'] ? 'Click to reset' : 'Download all images'}
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
                    <div className="flex gap-3">
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-500 rounded-xl"
                        style={{ fontWeight: 600, letterSpacing: '0.01em' }}
                        onClick={async () => {
                          // Save changes first
                          await saveChanges();
                          // Open preview in new tab after save completes
                          const previewUrl = `/builder/${taskId}/preview`;
                          window.open(previewUrl, '_blank');
                        }}
                        disabled={saving}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {saving ? 'Saving...' : 'Preview Site'}
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
                    versionHistory={versionHistory}
                    onVersionSelect={handleVersionSelect}
                    viewingVersionIndex={viewingVersionIndex}
                    editorOnlyMode={editorOnlyMode}
                    sidebarVisible={sidebarVisible}
                    setSidebarVisible={setSidebarVisible}
                    onHighlight={handleHighlight}
                    highlightDisabled={!selectedText}
                    onToggleImageHrefs={handleToggleImageHrefs}
                    hrefsImported={hrefsImported}
                    imagesUploaded={images.length > 0}
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
                          <CopyButton 
                            value={reviewsTag}
                            clickOrder={copyClickOrder['reviewsTag'] || null}
                            onCopyClick={() => handleCopyClick('reviewsTag')}
                            onResetClick={() => handleResetClick('reviewsTag')}
                          />
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
                          <CopyButton 
                            value={faqTag}
                            clickOrder={copyClickOrder['faqTag'] || null}
                            onCopyClick={() => handleCopyClick('faqTag')}
                            onResetClick={() => handleResetClick('faqTag')}
                          />
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
                      <label className="text-sm font-medium mb-1 block">Enter a City, ST:</label>
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
                        <CopyButton 
                          value={mapsEmbedCode}
                          clickOrder={copyClickOrder['mapsEmbedCode'] || null}
                          onCopyClick={() => handleCopyClick('mapsEmbedCode')}
                          onResetClick={() => handleResetClick('mapsEmbedCode')}
                        />
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
                        onPaste={e => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          handleTextChange('instructionsToLink', pastedText.trimStart());
                        }}
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
        <GoogleDocImportModal
          open={googleDocImportOpen}
          onOpenChange={setGoogleDocImportOpen}
          onApply={handleApplyImageMetadata}
          pastedContent={googleDocPastedContent}
          setPastedContent={setGoogleDocPastedContent}
          parsedImages={googleDocParsedImages}
          setParsedImages={setGoogleDocParsedImages}
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
