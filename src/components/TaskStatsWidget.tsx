import React, { useEffect, useState } from 'react';
import { fetchSheetTaskStats, SheetTaskStats, SheetTask } from '@/utils/googleSheets';
import { Loader2, RefreshCw, FileText, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetNameConfig } from './SheetNameConfig';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function TaskStatsWidget() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState<SheetTaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    const data = await fetchSheetTaskStats();
    
    if (data) {
      setStats(data);
      setLastUpdated(new Date());
    } else {
      setError('Unable to load stats');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Task Status</h3>
        <div className="flex items-center gap-2">
          <SheetNameConfig />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadStats}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
        {/* Not Started (Left) */}
        <div className="bg-card border-2 border-red-500/20 rounded-lg p-2 sm:p-3 text-center">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight">{stats?.notStarted || 0}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Not Started</div>
        </div>

        {/* In Progress (Middle) */}
        <div className="bg-card border-2 border-amber-500/20 rounded-lg p-2 sm:p-3 text-center">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">{stats?.inProgress || 0}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">In Progress</div>
        </div>

        {/* Ready to Post (Right) */}
        <div className="bg-card border-2 border-emerald-500/20 rounded-lg p-2 sm:p-3 text-center">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 mx-auto mb-1 sm:mb-2" />
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">{stats?.ready || 0}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Ready to Post</div>
        </div>
      </div>

      {/* Task List - Table Style - Only show when logged in */}
      {isLoggedIn && stats?.tasks && stats.tasks.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">Task Details</h4>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-none overflow-visible">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-semibold border-r border-b">Status</th>
                    <th className="text-left p-2 font-semibold border-r border-b">Company</th>
                    <th className="text-left p-2 font-semibold border-r border-b">Type</th>
                    <th className="text-left p-2 font-semibold border-r border-b">Price</th>
                    <th className="text-left p-2 font-semibold border-r border-b">Author</th>
                    <th className="text-center p-2 font-semibold border-b w-12">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tasks.map((task, index) => {
                    const statusLower = task.status.toLowerCase();
                    
                    // Filter out "Posted Live" and "Don't/Dont Do" tasks
                    if (statusLower.includes('posted') || statusLower.includes('live') || statusLower.includes('don\'t') || statusLower.includes('dont')) {
                      return null;
                    }
                    
                    // Determine background color and text color with inline styles for stronger visibility
                    let statusBgStyle = {};
                    let statusTextClass = '';
                    
                    if (statusLower.includes('ready')) {
                      statusBgStyle = { backgroundColor: 'rgba(22, 163, 74, 0.3)' }; // green-600 with 30% opacity
                      statusTextClass = 'text-green-300';
                    } else if (statusLower.includes('batch') || statusLower.includes('progress')) {
                      statusBgStyle = { backgroundColor: 'rgba(202, 138, 4, 0.3)' }; // yellow-600 with 30% opacity
                      statusTextClass = 'text-yellow-300';
                    } else if (statusLower.includes('not') || statusLower.includes('new')) {
                      statusBgStyle = { backgroundColor: 'rgba(220, 38, 38, 0.3)' }; // red-600 with 30% opacity
                      statusTextClass = 'text-red-300';
                    } else {
                      statusBgStyle = { backgroundColor: 'rgba(75, 85, 99, 0.3)' }; // gray-600 with 30% opacity
                      statusTextClass = 'text-gray-300';
                    }

                    // Check if this is the first task of a new batch (based on batch number change)
                    // Also check if previous visible task had a different batch number
                    const visibleTasks = stats.tasks.filter((t) => {
                      const tStatusLower = t.status.toLowerCase();
                      return !(tStatusLower.includes('posted') || tStatusLower.includes('live') || tStatusLower.includes('don\'t') || tStatusLower.includes('dont'));
                    });
                    const visibleIndex = visibleTasks.findIndex(t => t === task);
                    const isNewBatch = visibleIndex === 0 || task.batchNumber !== visibleTasks[visibleIndex - 1]?.batchNumber;

                    return (
                      <React.Fragment key={index}>
                        {isNewBatch && (
                          <tr style={{ backgroundColor: '#3b82f6' }}>
                            <td colSpan={6} style={{ backgroundColor: '#3b82f6' }} className="p-3 text-center text-sm font-bold text-white border-t-2 border-gray-600">
                              <div className="flex items-center justify-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{task.company} - Batch</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-muted/50">
                          <td 
                            style={statusBgStyle}
                            className={`p-2 border-r border-b truncate max-w-[120px] font-medium ${statusTextClass}`}
                          >
                            {task.status}
                          </td>
                          <td className="p-2 border-r border-b truncate max-w-[120px]">{task.company}</td>
                          <td className="p-2 border-r border-b truncate max-w-[100px]">{task.type}</td>
                          <td className="p-2 border-r border-b">{task.price}</td>
                          <td className="p-2 border-r border-b">{task.author}</td>
                          <td className="p-2 border-b text-center">
                            {task.htmlStudioLink && (
                              <a 
                                href={task.htmlStudioLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block opacity-50 hover:opacity-100"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Tasks</span>
          <span className="text-lg font-semibold">{stats?.total || 0}</span>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

