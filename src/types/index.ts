export interface Company {
  id: string;
  name: string;
  contactLink: string;
}

export interface Task {
  id: string;
  companyId: string;
  teamworkLink: string;
  type: TaskType;
  status: TaskStatus;
  notes: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskType {
  BLOG = 'Blog',
  SUB_PAGE = 'Sub Page',
  LANDING_PAGE = 'Landing Page'
}

export enum TaskStatus {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  RECENTLY_DELETED = 'RECENTLY_DELETED'
}

export interface HTMLTag {
  name: string;
  openTag: string;
  closeTag: string | null;
  description?: string;
  category?: string;
}
