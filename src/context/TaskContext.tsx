import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus, TaskType, Company, HtmlTemplate } from '../types';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { deleteImage } from '@/utils/imageUpload';
import { User } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

interface TaskContextType {
  tasks: Task[];
  companies: Company[];
  templates: HtmlTemplate[];
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string | string[]) => Promise<void>;
  hardDeleteTask: (taskId: string | string[]) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;
  getCompanyById: (id: string) => Company | undefined;
  updateCompany: (companyId: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
  addTemplate: (template: Omit<HtmlTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (templateId: string, updates: Partial<HtmlTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  getTemplatesByCompany: (companyId: string) => HtmlTemplate[];
  getTemplatesByPageType: (pageType: TaskType) => HtmlTemplate[];
  tasksLoading: boolean;
  getCompanyTags: (companyId: string) => Promise<CompanyTags | null>;
  setCompanyTags: (companyId: string, tags: CompanyTags) => Promise<void>;
  subscribeToCompanyTags: (companyId: string, callback: (tags: CompanyTags | null) => void) => () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

/**
 * Recursively removes undefined values from an object
 * @param obj - The object to sanitize
 * @returns A new object with all undefined values removed
 */
function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    // Remove undefined from arrays and recursively sanitize
    return obj.filter(v => v !== undefined).map(removeUndefined) as T;
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as object)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    ) as T;
  }
  return obj;
}

const defaultTask: Partial<Task> = {
  companyId: '',
  teamworkLink: '',
  type: TaskType.BLOG,
  status: TaskStatus.IN_PROGRESS,
  notes: '',
  htmlContent: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [],
};

interface TaskProviderProps {
  children: React.ReactNode;
  user: User | null | undefined; // undefined = not loaded yet
}

const AUTHORIZED_EMAILS = ["dklegson@gmail.com", "dklegson1@gmail.com"]; // Add your emails here

const DEFAULT_COMPANY = {
  name: 'ocboston',
  contactLink: 'https://ocboston.com/contact/',
  basePath: 'https://ocboston.com/wp-content/uploads/',
  prefix: 'ocboston_Landing-Page_',
  fileSuffix: '-image.webp'
};

// Tag management for company tags
export interface CompanyTags {
  reviewTags: string[];
  faqTags: string[];
}

const getCompanyTags = async (companyId: string): Promise<CompanyTags | null> => {
  const ref = doc(db, 'companyTags', companyId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as CompanyTags;
  }
  return null;
};

const setCompanyTags = async (companyId: string, tags: CompanyTags): Promise<void> => {
  const ref = doc(db, 'companyTags', companyId);
  await setDoc(ref, tags, { merge: true });
};

const subscribeToCompanyTags = (companyId: string, callback: (tags: CompanyTags | null) => void) => {
  const ref = doc(db, 'companyTags', companyId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CompanyTags);
    } else {
      callback(null);
    }
  });
};

export const TaskProvider: React.FC<TaskProviderProps> = ({ children, user }) => {
  console.log("TaskProvider user:", user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [templates, setTemplates] = useState<HtmlTemplate[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const isAuthorized = user?.email ? AUTHORIZED_EMAILS.includes(user.email) : false;

  /**
   * Fetches all companies from Firestore
   */
  const fetchCompanies = async () => {
    if (!isAuthorized) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      const companiesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      
      // Only create default company if there are no companies at all
      if (companiesList.length === 0) {
        // Add default company if no companies exist
        await addDoc(collection(db, 'companies'), DEFAULT_COMPANY);
        // Fetch companies again to include the new default company
        const updatedSnapshot = await getDocs(collection(db, 'companies'));
        setCompanies(updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
      } else {
        setCompanies(companiesList);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchCompanies().catch(console.error);
    }
  }, [isAuthorized, user?.uid]);

  /**
   * Adds a new company to Firestore
   */
  const addCompany = async (company: Omit<Company, 'id'>) => {
    if (!isAuthorized) return;
    try {
      await addDoc(collection(db, 'companies'), company);
      await fetchCompanies();
    } catch (error) {
      console.error('Failed to add company:', error);
      throw error;
    }
  };

  /**
   * Updates an existing company in Firestore
   */
  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    if (!isAuthorized) return;
    try {
      await updateDoc(doc(db, 'companies', companyId), updates);
      setCompanies(prev => prev.map(company =>
        company.id === companyId ? { ...company, ...updates } : company
      ));
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  };

  /**
   * Deletes a company and all its associated tasks from Firestore
   */
  const deleteCompany = async (companyId: string) => {
    if (!isAuthorized) return;
    try {
      // First update the local state to prevent UI flicker
      setCompanies(prev => prev.filter(company => company.id !== companyId));
      setTasks(prev => prev.filter(task => task.companyId !== companyId));
      
      // Then delete from Firestore
      await deleteDoc(doc(db, 'companies', companyId));
      
      // No need to fetch companies again since we've already updated the local state
    } catch (error) {
      console.error('Failed to delete company:', error);
      // If there's an error, fetch companies to ensure sync
      await fetchCompanies();
      throw error;
    }
  };

  const getCompanyById = (id: string) => companies.find(company => company.id === id);

  /**
   * Fetches all tasks from Firestore
   */
  const fetchTasks = async () => {
    if (!isAuthorized) {
      setTasksLoading(false);
      return;
    }
    setTasksLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      setTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (user === undefined) return;
    fetchTasks().catch(console.error);
  }, [isAuthorized, user]);

  /**
   * Fetches all templates from Firestore
   */
  const fetchTemplates = async () => {
    if (!isAuthorized) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'templates'));
      setTemplates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HtmlTemplate)));
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTemplates().catch(console.error);
  }, [isAuthorized]);

  /**
   * Adds a new task to Firestore
   */
  const addTask = async (task: Partial<Task>): Promise<Task> => {
    console.log("addTask called, isAuthorized:", user, "user:", user);
    if (!isAuthorized) {
      console.log("Creating local task for unauthorized user", task);
      const newTask: Task = {
        id: uuidv4(),
        companyId: task.companyId ?? "",
        teamworkLink: task.teamworkLink ?? "",
        type: task.type ?? TaskType.BLOG,
        status: task.status ?? TaskStatus.IN_PROGRESS,
        notes: task.notes ?? "",
        htmlContent: task.htmlContent ?? "",
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalTasks(prev => [...prev, newTask]);
      setCurrentTask(newTask);
      return newTask;
    }
    try {
      const newTask: Omit<Task, 'id'> = {
        companyId: task.companyId ?? defaultTask.companyId!,
        teamworkLink: task.teamworkLink ?? defaultTask.teamworkLink!,
        type: task.type ?? defaultTask.type!,
        status: task.status ?? defaultTask.status!,
        notes: task.notes ?? defaultTask.notes!,
        htmlContent: task.htmlContent ?? defaultTask.htmlContent!,
        images: task.images ?? defaultTask.images!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const sanitizedTask = removeUndefined(newTask);
      const docRef = await addDoc(collection(db, 'tasks'), sanitizedTask);
      await fetchTasks();
      const createdTask = { ...sanitizedTask, id: docRef.id };
      setCurrentTask(createdTask);
      return createdTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  };

  /**
   * Updates an existing task in Firestore
   */
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!taskId) {
      console.error('[updateTask] taskId is undefined or empty!', { taskId, updates });
      return;
    }
    try {
      const taskDoc = doc(db, 'tasks', taskId);
      const snap = await getDoc(taskDoc);
      const prevData = snap.data() || {};

      const merged = {
        ...defaultTask,
        ...prevData,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      const sanitized = removeUndefined(merged);

      // Debug log to catch undefineds
      if (process.env.NODE_ENV !== 'production') {
        console.log('[updateTask] sanitized data:', JSON.stringify(sanitized, null, 2));
      }

      // Update Firebase in the background
      updateDoc(taskDoc, sanitized).catch(error => {
        console.error('Failed to update task in Firebase:', error);
      });
      
      // Update tasks state locally immediately
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );

      // Update current task if it's the one being modified
      if (currentTask?.id === taskId) {
        setCurrentTask(prev => ({ ...prev!, ...updates, updatedAt: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  /**
   * Soft deletes one or more tasks by marking them as RECENTLY_DELETED
   */
  const deleteTask = async (taskId: string | string[]) => {
    try {
      const ids = Array.isArray(taskId) ? taskId : [taskId];
      await Promise.all(ids.map(id => 
        updateDoc(doc(db, 'tasks', id), {
          status: TaskStatus.RECENTLY_DELETED,
          updatedAt: new Date().toISOString()
        })
      ));
      await fetchTasks();
      
      if (currentTask && ids.includes(currentTask.id)) {
        setCurrentTask(null);
      }
    } catch (error) {
      console.error('Failed to soft delete task(s):', error);
      throw error;
    }
  };

  /**
   * Permanently deletes one or more tasks from Firestore
   */
  const hardDeleteTask = async (taskId: string | string[]) => {
    try {
      const ids = Array.isArray(taskId) ? taskId : [taskId];
      
      // First, get all tasks to be deleted to handle their images
      const tasksToDelete = tasks.filter(task => ids.includes(task.id));
      
      // Delete all associated images from Storage
      await Promise.all(tasksToDelete.flatMap(task => 
        task.images.map(img => deleteImage(img.url))
      ));
      
      // Delete the tasks from Firestore
      await Promise.all(ids.map(id => deleteDoc(doc(db, 'tasks', id))));
      await fetchTasks();
      
      if (currentTask && ids.includes(currentTask.id)) {
        setCurrentTask(null);
      }
    } catch (error) {
      console.error('Failed to hard delete task(s):', error);
      throw error;
    }
  };

  /**
   * Restores a soft-deleted task by setting its status back to IN_PROGRESS
   */
  const restoreTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: TaskStatus.IN_PROGRESS,
        updatedAt: new Date().toISOString()
      });
      await fetchTasks();
    } catch (error) {
      console.error('Failed to restore task:', error);
      throw error;
    }
  };

  /**
   * Adds a new template to Firestore
   */
  const addTemplate = async (template: Omit<HtmlTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAuthorized) return;
    try {
      const now = new Date().toISOString();
      const newTemplate = {
        ...template,
        createdAt: now,
        updatedAt: now,
      };
      await addDoc(collection(db, 'templates'), newTemplate);
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to add template:', error);
      throw error;
    }
  };

  /**
   * Updates an existing template in Firestore
   */
  const updateTemplate = async (templateId: string, updates: Partial<HtmlTemplate>) => {
    if (!isAuthorized) return;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'templates', templateId), {
        ...updates,
        updatedAt: now,
      });
      setTemplates(prev => prev.map(template =>
        template.id === templateId ? { ...template, ...updates, updatedAt: now } : template
      ));
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  };

  /**
   * Deletes a template from Firestore
   */
  const deleteTemplate = async (templateId: string) => {
    if (!isAuthorized) return;
    try {
      await deleteDoc(doc(db, 'templates', templateId));
      setTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  };

  /**
   * Gets templates for a specific company
   */
  const getTemplatesByCompany = (companyId: string) => {
    return templates.filter(template => template.companyId === companyId);
  };

  /**
   * Gets templates for a specific page type
   */
  const getTemplatesByPageType = (pageType: TaskType) => {
    return templates.filter(template => template.pageType === pageType);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: isAuthorized ? tasks : localTasks,
        companies: isAuthorized ? companies : [],
        templates: isAuthorized ? templates : [],
        currentTask,
        setCurrentTask,
        addTask,
        updateTask,
        deleteTask,
        hardDeleteTask,
        restoreTask,
        getCompanyById,
        updateCompany,
        deleteCompany,
        addCompany,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplatesByCompany,
        getTemplatesByPageType,
        tasksLoading,
        getCompanyTags,
        setCompanyTags,
        subscribeToCompanyTags,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
