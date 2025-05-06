import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus, TaskType, Company } from '../types';
import { companies, sampleTasks } from '../data/mockData';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface TaskContextType {
  tasks: Task[];
  companies: Company[];
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  addTask: (task: Partial<Task>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string | string[]) => void;
  getCompanyById: (id: string) => Company | undefined;
  updateCompany: (companyId: string, updates: Partial<Company>) => void;
  deleteCompany: (companyId: string) => void;
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Fetch companies from Firestore
  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    setCompanies(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
  };

  // Fetch companies from Firestore on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Add company
  const addCompany = async (company: Omit<Company, 'id'>) => {
    try {
      await addDoc(collection(db, 'companies'), company);
      await fetchCompanies();
    } catch (error: any) {
      alert('Failed to add company: ' + (error?.message || error));
    }
  };

  // Update company
  const updateCompany = async (companyId: string, updates: Partial<Company>) => {
    await updateDoc(doc(db, 'companies', companyId), updates);
    setCompanies(prev => prev.map(company =>
      company.id === companyId ? { ...company, ...updates } : company
    ));
  };

  // Delete company (and all tasks for that company)
  const deleteCompany = async (companyId: string) => {
    await deleteDoc(doc(db, 'companies', companyId));
    setCompanies(prev => prev.filter(company => company.id !== companyId));
    setTasks(prev => prev.filter(task => task.companyId !== companyId));
  };

  const getCompanyById = (id: string) => {
    return companies.find((company) => company.id === id);
  };

  // Fetch tasks from Firestore
  const fetchTasks = async () => {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    setTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
  };

  // Fetch tasks from Firestore on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Add task
  const addTask = async (task: Partial<Task>): Promise<Task> => {
    const newTask: Omit<Task, 'id'> = {
      companyId: task.companyId || '',
      teamworkLink: task.teamworkLink || '',
      type: task.type || TaskType.BLOG,
      status: task.status || TaskStatus.IN_PROGRESS,
      notes: task.notes || '',
      htmlContent: task.htmlContent || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    await fetchTasks();
    return { ...newTask, id: docRef.id };
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await fetchTasks();
    // Update currentTask if it's the one being updated
    if (currentTask && currentTask.id === taskId) {
      setCurrentTask({ ...currentTask, ...updates, updatedAt: new Date().toISOString() });
    }
  };

  // Delete task
  const deleteTask = async (taskId: string | string[]) => {
    const ids = Array.isArray(taskId) ? taskId : [taskId];
    await Promise.all(ids.map(id => deleteDoc(doc(db, 'tasks', id))));
    await fetchTasks();
    // Clear currentTask if it's one of the tasks being deleted
    if (currentTask && ids.includes(currentTask.id)) {
      setCurrentTask(null);
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
