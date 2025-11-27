import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskStatus, TaskType, Task } from '@/types';
import { Copy, Plus, Trash2, CheckSquare, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useIsMobile } from '@/hooks/use-mobile';

const statusToTabMap: Record<TaskStatus, string> = {
  [TaskStatus.READY]: 'ready',
  [TaskStatus.IN_PROGRESS]: 'in-progress',
  [TaskStatus.FINISHED]: 'posted-live',
  [TaskStatus.RECENTLY_DELETED]: 'recently-deleted'
};

const Dashboard: React.FC = () => {
  // Set page title
  useEffect(() => {
    document.title = 'Dashboard';
  }, []);

  const {
    tasks,
    companies,
    addTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    currentTask,
    hardDeleteTask
  } = useTaskContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for multi-select and delete confirmation
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => window.localStorage.getItem('dashboardTab') || 'ready');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Add local state for editing notes
  const [editingNotes, setEditingNotes] = useState<{ [taskId: string]: string }>({});
  // Add local state for editing teamwork links
  const [editingTeamworkLinks, setEditingTeamworkLinks] = useState<{ [taskId: string]: string }>({});
  const isMobile = useIsMobile();

  // Set the active tab based on the current task's status
  useEffect(() => {
    if (currentTask) {
      // Only auto-switch tab if not recently deleted
      if (currentTask.status !== TaskStatus.RECENTLY_DELETED) {
        setActiveTab(statusToTabMap[currentTask.status] || 'ready');
      }
      // If recently deleted, do not change the tab
    }
  }, [currentTask]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTasks([]);
    }
  };

  const handleCreateTask = async () => {
    const newTask = await addTask({});
    setCurrentTask(newTask);
    navigate(`/builder/${newTask.id}`);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    navigate(`/builder/${task.id}`);
  };

  const handleUpdateTaskField = (taskId: string, field: keyof Task, value: any) => {
    updateTask(taskId, {
      [field]: value
    } as Partial<Task>);
  };

  const handleDeleteTask = (taskIds: string | string[]) => {
    const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
    setTaskToDelete(ids);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (taskToDelete && taskToDelete.length > 0) {
      const isRecentlyDeletedTab = activeTab === 'recently-deleted';
      
      if (isRecentlyDeletedTab) {
        // Permanently delete tasks
        hardDeleteTask(taskToDelete);
        toast({
          title: "Tasks permanently deleted",
          description: `${taskToDelete.length} tasks have been permanently deleted.`,
          duration: 2000
        });
      } else {
        // Move to recently deleted - update all tasks at once
        taskToDelete.forEach(id => {
          updateTask(id, { status: TaskStatus.RECENTLY_DELETED });
        });
        toast({
          title: "Tasks deleted",
          description: `${taskToDelete.length} tasks have been moved to Recently Deleted.`,
          duration: 2000
        });
      }
      
      setShowDeleteDialog(false);
      setTaskToDelete(null);
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAllTasks = (taskList: Task[], checked: boolean) => {
    if (checked) {
      setSelectedTasks(taskList.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The link has been copied to your clipboard.",
      duration: 2000
    });
  };

  // Filter tasks by status
  const readyTasks = tasks.filter(task => task.status === TaskStatus.READY);
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const postedLiveTasks = tasks.filter(task => task.status === TaskStatus.FINISHED);
  const recentlyDeletedTasks = tasks.filter(task => task.status === TaskStatus.RECENTLY_DELETED);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const renderTaskTable = (taskList: Task[], tabKey?: string) => (
    isMobile ? (
      <div className="flex flex-col gap-2 w-full">
        {taskList.length === 0 ? (
          <div className="text-center py-6 text-xs">No tasks found</div>
        ) : (
          taskList.map(task => (
            <div key={task.id} className={cn(
              "rounded-lg border bg-card p-2 flex flex-col gap-1 shadow-sm text-xs",
              currentTask?.id === task.id && "ring-2 ring-primary"
            )}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">{companies.find(c => c.id === task.companyId)?.name || 'Unassigned'}</span>
                <span className="bg-muted px-2 py-0.5 rounded text-[10px]">{task.type}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-muted-foreground">Teamwork Link:</span>
                <div className="flex gap-1 items-center">
                  <Input
                    value={editingTeamworkLinks[task.id] !== undefined ? editingTeamworkLinks[task.id] : task.teamworkLink}
                    onChange={e => setEditingTeamworkLinks(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onBlur={e => {
                      if (editingTeamworkLinks[task.id] !== undefined && editingTeamworkLinks[task.id] !== task.teamworkLink) {
                        handleUpdateTaskField(task.id, 'teamworkLink', editingTeamworkLinks[task.id]);
                      }
                    }}
                    className="w-full text-xs px-2 py-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(task.teamworkLink)} className="flex-shrink-0 p-1 h-6 w-6">
                    <Copy size={12} />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-muted-foreground">Status:</span>
                <Select value={task.status} onValueChange={value => handleUpdateTaskField(task.id, 'status', value)}>
                  <SelectTrigger className="w-full text-xs px-2 py-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus)
                      .filter(status => status !== TaskStatus.RECENTLY_DELETED)
                      .map(status => (
                        <SelectItem key={status} value={status} className="text-xs">
                          {status}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-muted-foreground">Notes:</span>
                <Input
                  value={editingNotes[task.id] !== undefined ? editingNotes[task.id] : task.notes}
                  onChange={e => setEditingNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                  onBlur={e => {
                    if (editingNotes[task.id] !== undefined && editingNotes[task.id] !== task.notes) {
                      handleUpdateTaskField(task.id, 'notes', editingNotes[task.id]);
                    }
                  }}
                  className="w-full text-xs px-2 py-1"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-muted-foreground">{formatDate(task.updatedAt)}</span>
                <div className="flex gap-1">
                  <Button size="sm" className="text-xs px-2 py-1 h-6">Edit</Button>
                  <Button size="sm" variant="destructive" className="text-xs px-2 py-1 h-6">Delete</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    ) : (
      <div className="overflow-x-auto w-full">
        <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            {isSelectionMode && (
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={taskList.length > 0 && taskList.every(task => selectedTasks.includes(task.id))}
                  onCheckedChange={(checked) => handleSelectAllTasks(taskList, checked as boolean)}
                />
              </TableHead>
            )}
            <TableHead className="min-w-[120px]">Title</TableHead>
            <TableHead className="min-w-[120px]">Teamwork Link</TableHead>
            <TableHead className="min-w-[80px]">Type</TableHead>
            <TableHead className="min-w-[80px]">Status</TableHead>
            <TableHead className="min-w-[100px]">Notes</TableHead>
            <TableHead className="min-w-[80px]">Date</TableHead>
            <TableHead className="min-w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taskList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isSelectionMode ? 8 : 7} className="text-center py-6">No tasks found</TableCell>
            </TableRow>
          ) : (
            taskList.map(task => (
              <TableRow 
                key={task.id}
                className={cn(
                  "transition-colors",
                  currentTask?.id === task.id && "highlight-task-row"
                )}
              >
                {isSelectionMode && (
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  {task.widgetTitle || 'No Widget Title'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={editingTeamworkLinks[task.id] !== undefined ? editingTeamworkLinks[task.id] : task.teamworkLink}
                      onChange={e => setEditingTeamworkLinks(prev => ({ ...prev, [task.id]: e.target.value }))}
                      onBlur={e => {
                        if (editingTeamworkLinks[task.id] !== undefined && editingTeamworkLinks[task.id] !== task.teamworkLink) {
                          handleUpdateTaskField(task.id, 'teamworkLink', editingTeamworkLinks[task.id]);
                        }
                      }}
                      className="w-full"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(task.teamworkLink)} className="flex-shrink-0">
                      <Copy size={16} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {task.type}
                </TableCell>
                <TableCell>
                  <Select value={task.status} onValueChange={value => handleUpdateTaskField(task.id, 'status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus)
                        .filter(status => status !== TaskStatus.RECENTLY_DELETED)
                        .map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={editingNotes[task.id] !== undefined ? editingNotes[task.id] : task.notes}
                    onChange={e => setEditingNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onBlur={e => {
                      if (editingNotes[task.id] !== undefined && editingNotes[task.id] !== task.notes) {
                        handleUpdateTaskField(task.id, 'notes', editingNotes[task.id]);
                      }
                    }}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  {formatDate(task.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {tabKey === 'ready' ? (
                      <Button size="sm" variant="default" onClick={() => handleEditTask(task)}>
                        Open
                      </Button>
                    ) : (
                      <Button size="sm" variant="default" onClick={() => handleEditTask(task)}>
                        Edit
                      </Button>
                    )}
                    {!isSelectionMode && (
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    )
  );

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload(); // Or navigate to login if needed
  };

  return (
    <div>
      <div className="container mx-auto py-8 px-px">
        <div className="flex items-center justify-between mb-8">
          <h1 
            className="text-3xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#2563eb] bg-clip-text text-transparent drop-shadow-md cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            Welcome to the Studio
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>Go back to Homepage</Button>
            <Button
              onClick={toggleSelectionMode}
              variant={isSelectionMode ? "secondary" : "outline"}
              className="flex items-center gap-2"
            >
              {isSelectionMode ? (
                <>
                  <X size={16} />
                  Cancel Selection
                </>
              ) : (
                <>
                  <CheckSquare size={16} />
                  Select Tasks
                </>
              )}
            </Button>
            <Button onClick={handleCreateTask} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create New Task
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden task-table-container">
          <Tabs value={activeTab} onValueChange={tab => { setActiveTab(tab); window.localStorage.setItem('dashboardTab', tab); }} className="w-full">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="ready">Ready ({readyTasks.length})</TabsTrigger>
              <TabsTrigger 
                value="in-progress" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:border-amber-500 data-[state=active]:shadow-lg font-semibold"
              >
                In Progress ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger value="posted-live">Posted Live ({postedLiveTasks.length})</TabsTrigger>
              <TabsTrigger value="recently-deleted">Recently Deleted ({recentlyDeletedTasks.length})</TabsTrigger>
            </TabsList>

            {isSelectionMode && selectedTasks.length > 0 && (
              <div className="px-4 pb-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleDeleteTask(selectedTasks)}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete {selectedTasks.length} tasks
                </Button>
              </div>
            )}
            
            <TabsContent value="ready">
              {renderTaskTable(readyTasks, 'ready')}
            </TabsContent>
            
            <TabsContent value="in-progress">
              {renderTaskTable(inProgressTasks, 'in-progress')}
            </TabsContent>
            
            <TabsContent value="posted-live">
              {renderTaskTable(postedLiveTasks, 'posted-live')}
            </TabsContent>
            
            <TabsContent value="recently-deleted">
              {renderTaskTable(recentlyDeletedTasks, 'recently-deleted')}
            </TabsContent>
          </Tabs>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {activeTab === 'recently-deleted' 
                  ? "These tasks will be permanently deleted and cannot be recovered."
                  : "These tasks will be moved to the Recently Deleted tab. You can restore them later if needed."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                {activeTab === 'recently-deleted' ? "Permanently Delete" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Dashboard;