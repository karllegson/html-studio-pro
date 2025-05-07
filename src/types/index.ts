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
  type: TaskType;
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
