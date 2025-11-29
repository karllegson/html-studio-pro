import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaskStatus, TaskType, Task } from '@/types';
import { Copy, Plus, Trash2, CheckSquare, X, Menu, LogIn, LogOut, ArrowLeft } from 'lucide-react';
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
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoginModal } from '@/components/LoginModal';

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

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
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
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if app is in standalone mode (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
  
  // Show back button only in standalone mode and if not on home page
  const canGoBack = isStandalone && location.pathname !== '/';
  
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <div className="w-full">
        {taskList.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No tasks found</div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            {taskList.map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  "border-b border-border last:border-b-0 bg-card transition-colors",
                  currentTask?.id === task.id && "bg-primary/10"
                )}
              >
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {task.widgetTitle || companies.find(c => c.id === task.companyId)?.name || 'Unassigned'}
                      </span>
                      <span className="bg-muted/80 text-muted-foreground px-2 py-0.5 rounded-md text-[10px] font-medium flex-shrink-0">
                        {task.type}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Select 
                        value={task.status} 
                        onValueChange={value => handleUpdateTaskField(task.id, 'status', value)}
                      >
                        <SelectTrigger className="text-xs h-6 px-2 py-0 border-border bg-muted/50 hover:bg-muted w-auto">
                          <SelectValue />
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
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {task.teamworkLink && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(task.teamworkLink)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Copy size={14} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleEditTask(task)}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      {tabKey === 'ready' ? 'Open' : 'Edit'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                  <div className="flex gap-2 items-center min-w-0">
                    <Input
                      value={editingTeamworkLinks[task.id] !== undefined ? editingTeamworkLinks[task.id] : task.teamworkLink}
                      onChange={e => setEditingTeamworkLinks(prev => ({ ...prev, [task.id]: e.target.value }))}
                      onBlur={e => {
                        if (editingTeamworkLinks[task.id] !== undefined && editingTeamworkLinks[task.id] !== task.teamworkLink) {
                          handleUpdateTaskField(task.id, 'teamworkLink', editingTeamworkLinks[task.id]);
                        }
                      }}
                      className="w-full flex-1 min-w-0"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(task.teamworkLink)} className="flex-shrink-0 h-8 w-8 p-0">
                      <Copy size={12} />
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

  const handleAuthAction = async () => {
    if (isLoggedIn) {
      await signOut(auth);
      // Stay on dashboard after logout
    } else {
      // Show login modal
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navbar */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between w-full">
            {/* Left side: Back button (if can go back) and Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-shrink-0" onClick={() => navigate('/')}>
                <img src="/favicon.svg" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                <span className="text-base sm:text-xl font-bold whitespace-nowrap truncate">HTML Studio Pro</span>
              </div>
            </div>
            
            {/* Nav Links - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <button 
                onClick={() => navigate('/')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Dashboard
              </button>
              <button 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/tools' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Tools
              </button>
              <button 
                onClick={() => navigate('/earnings')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/earnings' 
                    ? 'text-primary font-semibold' 
                    : 'hover:text-primary'
                }`}
              >
                Earnings
              </button>
            </div>
            
            {/* Right side - Desktop Login or Mobile Hamburger */}
            <div className="flex items-center">
              {/* Desktop Login Button */}
              <Button variant="outline" size="sm" onClick={handleAuthAction} className="hidden md:flex">
                {isLoggedIn ? (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>

              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 w-72 bg-card border-l border-border z-50 md:hidden shadow-xl mobile-sidebar-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src="/favicon.svg" alt="Logo" className="w-6 h-6 flex-shrink-0" />
                  <span className="text-base font-bold whitespace-nowrap truncate">HTML Studio Pro</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0 -mr-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                <button 
                  onClick={() => {
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Home</span>
                  {location.pathname === '/' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/dashboard' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Dashboard</span>
                  {location.pathname === '/dashboard' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/tools' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Tools</span>
                  {location.pathname === '/tools' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    navigate('/earnings');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                    location.pathname === '/earnings' 
                      ? 'bg-primary/20 text-primary font-semibold' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <span>Earnings</span>
                  {location.pathname === '/earnings' && (
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  )}
                </button>
              </nav>

              {/* Footer with Logout */}
              <div className="p-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    handleAuthAction();
                    setMobileMenuOpen(false);
                  }}
                >
                  {isLoggedIn ? (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dashboard Content */}
      <div className="container mx-auto py-8 px-px">
        {/* Action Buttons */}
        <div className={cn(
          "flex items-center justify-end gap-2 mb-8 flex-wrap",
          isMobile && "flex-col items-stretch gap-2 mb-4"
        )}>
          <Button
            onClick={toggleSelectionMode}
            variant={isSelectionMode ? "secondary" : "outline"}
            className={cn(
              "flex items-center gap-2",
              isMobile && "w-full justify-center"
            )}
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
          <Button 
            onClick={handleCreateTask} 
            className={cn(
              "px-4 py-2 bg-green-600 hover:bg-green-700 text-white",
              isMobile && "w-full justify-center"
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Task
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden task-table-container">
          <Tabs value={activeTab} onValueChange={tab => { setActiveTab(tab); window.localStorage.setItem('dashboardTab', tab); }} className="w-full">
            <TabsList className={cn(
              "grid grid-cols-4 mb-2 w-full",
              isMobile && "grid-cols-2 gap-1.5 p-1.5 w-full !h-auto !inline-grid"
            )}>
              <TabsTrigger 
                value="ready"
                className={cn(
                  isMobile && "text-[10px] px-2 py-2 font-medium"
                )}
              >
                Ready ({readyTasks.length})
              </TabsTrigger>
              <TabsTrigger 
                value="in-progress" 
                className={cn(
                  "data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:border-amber-500 data-[state=active]:shadow-lg font-semibold",
                  isMobile && "text-[10px] px-2 py-2"
                )}
              >
                In Progress ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger 
                value="posted-live"
                className={cn(isMobile && "text-[10px] px-2 py-2 font-medium")}
              >
                Posted Live ({postedLiveTasks.length})
              </TabsTrigger>
              <TabsTrigger 
                value="recently-deleted"
                className={cn(isMobile && "text-[10px] px-2 py-2 font-medium")}
              >
                Deleted ({recentlyDeletedTasks.length})
              </TabsTrigger>
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

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default Dashboard;