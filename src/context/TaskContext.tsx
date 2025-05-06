import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus, TaskType, Company } from '../types';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

interface TaskContextType {
  tasks: Task[];
  companies: Company[];
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string | string[]) => Promise<void>;
  getCompanyById: (id: string) => Company | undefined;
  updateCompany: (companyId: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

/**
 * Recursively removes undefined values from an object
 * @param obj - The object to sanitize
 * @returns A new object with all undefined values removed
 */
function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T;
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

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  /**
   * Fetches all companies from Firestore
   */
  const fetchCompanies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      setCompanies(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCompanies().catch(console.error);
  }, []);

  /**
   * Adds a new company to Firestore
   */
  const addCompany = async (company: Omit<Company, 'id'>) => {
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
    try {
      await deleteDoc(doc(db, 'companies', companyId));
      setCompanies(prev => prev.filter(company => company.id !== companyId));
      setTasks(prev => prev.filter(task => task.companyId !== companyId));
    } catch (error) {
      console.error('Failed to delete company:', error);
      throw error;
    }
  };

  const getCompanyById = (id: string) => companies.find(company => company.id === id);

  /**
   * Fetches all tasks from Firestore
   */
  const fetchTasks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      setTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks().catch(console.error);
  }, []);

  /**
   * Adds a new task to Firestore
   */
  const addTask = async (task: Partial<Task>): Promise<Task> => {
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
      return { ...sanitizedTask, id: docRef.id };
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  };

  /**
   * Updates an existing task in Firestore
   */
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
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

      await updateDoc(taskDoc, sanitized);
      await fetchTasks();

      if (currentTask?.id === taskId) {
        setCurrentTask({ ...currentTask, ...updates, updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  /**
   * Deletes one or more tasks from Firestore
   */
  const deleteTask = async (taskId: string | string[]) => {
    try {
      const ids = Array.isArray(taskId) ? taskId : [taskId];
      await Promise.all(ids.map(id => deleteDoc(doc(db, 'tasks', id))));
      await fetchTasks();
      
      if (currentTask && ids.includes(currentTask.id)) {
        setCurrentTask(null);
      }
    } catch (error) {
      console.error('Failed to delete task(s):', error);
      throw error;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        companies,
        currentTask,
        setCurrentTask,
        addTask,
        updateTask,
        deleteTask,
        getCompanyById,
        updateCompany,
        deleteCompany,
        addCompany,
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
