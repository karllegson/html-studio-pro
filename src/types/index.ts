/**
 * Represents a company in the system
 */
export interface Company {
  /** Unique identifier for the company */
  id: string;
  /** Company name */
  name: string;
  /** URL or link to company contact information */
  contactLink: string;
  /** Base path for image URLs */
  basePath: string;
  /** Prefix for image filenames */
  prefix: string;
  /** Suffix for image filenames */
  fileSuffix: string;
  /** Optional company info for display */
  info?: string;
  /** Optional logo URL for the company */
  logoUrl?: string;
}

/**
 * Represents an HTML template in the system
 */
export interface HtmlTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Company ID this template belongs to */
  companyId: string;
  /** Type of page this template is for */
  pageType: TaskType;
  /** Name of the template */
  name: string;
  /** HTML content of the template */
  content: string;
  /** Description of the template */
  description: string;
  /** Whether this template is active */
  isActive: boolean;
  /** When the template was created */
  createdAt: string;
  /** When the template was last updated */
  updatedAt: string;
}

/**
 * Represents an image uploaded to a task
 */
export interface TaskImage {
  /** URL of the uploaded image */
  url: string;
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** ISO timestamp of when the image was uploaded */
  uploadedAt: string;
  /** Alt text for the image (from Google Doc import) */
  alt?: string;
  /** Title attribute for the image (from Google Doc import) */
  title?: string;
}

/**
 * Represents a task in the system
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  /** ID of the company this task belongs to */
  companyId: string;
  /** URL to the task in Teamwork */
  teamworkLink: string;
  /** Type of the task */
  type: TaskType | undefined;
  /** Current status of the task */
  status: TaskStatus;
  /** Additional notes about the task */
  notes: string;
  /** HTML content of the task */
  htmlContent: string;
  /** ISO timestamp of when the task was created */
  createdAt: string;
  /** ISO timestamp of when the task was last updated */
  updatedAt: string;
  /** Array of images associated with this task */
  images: TaskImage[];
  // Added for auto-save support
  googleDocLink?: string;
  featuredTitle?: string;
  featuredAlt?: string;
  widgetTitle?: string;
  metaTitle?: string;
  metaUrl?: string;
  metaDescription?: string;
  instructionsToLink?: string;
  mapsLocation?: string;
  mapsEmbedCode?: string;
  /** URL of the selected featured image */
  featuredImg?: string;
  selectedReviewTag?: string;
  selectedFaqTag?: string;
  /** Checked fields for completion tracking */
  checkedFields?: { [key: string]: boolean };
  /** HTML code version history (max 4 versions) */
  htmlVersionHistory?: Array<{
    content: string;
    timestamp: string;
    isCurrent: boolean;
  }>;
}

/**
 * Types of tasks that can be created
 */
export enum TaskType {
  BLOG = 'Blog',
  SUB_PAGE = 'Sub Page',
  LANDING_PAGE = 'Landing Page'
}

/**
 * Possible statuses for a task
 */
export enum TaskStatus {
  /** Task is ready to be worked on */
  READY = 'READY',
  /** Task is currently being worked on */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Task has been completed */
  FINISHED = 'FINISHED',
  /** Task was recently deleted (soft delete) */
  RECENTLY_DELETED = 'RECENTLY_DELETED'
}

/**
 * Represents an HTML tag in the builder
 */
export interface HTMLTag {
  /** Name of the HTML tag */
  name: string;
  /** Opening tag string */
  openTag: string;
  /** Closing tag string, null for self-closing tags */
  closeTag: string | null;
  /** Optional description of the tag's purpose */
  description?: string;
  /** Optional category for grouping tags */
  category?: string;
}
