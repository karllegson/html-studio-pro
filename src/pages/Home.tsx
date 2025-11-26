import { useNavigate } from 'react-router-dom';
import { FileText, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { TaskStatsWidget } from '@/components/TaskStatsWidget';

export default function Home() {
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = 'HTML Studio Pro';
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              HTML Studio Pro
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Professional HTML development environment for creating, managing, and previewing your web content with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="text-base px-6"
              >
                <FileText className="mr-2 h-5 w-5" />
                Go to Tasks
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  alert('Post a Batch - Coming Soon!\n\nThis feature is under development.');
                }}
                className="text-base px-6"
              >
                <Upload className="mr-2 h-5 w-5" />
                Post a Batch
                <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">SOON</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Task Stats Section */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <TaskStatsWidget />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tasks Feature */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Task Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Create and manage HTML projects with built-in templates, image handling, and WordPress preview.
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => navigate('/dashboard')}
                  >
                    Get Started <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Batch Processing Feature */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow opacity-60">
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/10 p-3 rounded-lg">
                  <Upload className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Batch Processing
                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Upload and process multiple HTML files at once with automated workflows and bulk operations.
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-muted-foreground"
                    disabled
                  >
                    Available Soon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

