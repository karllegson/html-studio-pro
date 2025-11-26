import { useNavigate } from 'react-router-dom';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = 'HTML Studio Pro';
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            HTML Studio Pro
          </h1>
          <p className="text-xl text-gray-400">
            Professional HTML Development Environment
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tasks Button */}
          <div 
            className="group relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => navigate('/dashboard')}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/20 transition-all duration-300">
                <FileText size={80} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Tasks
              </h2>
              <p className="text-blue-100 text-lg">
                Manage your HTML projects and tasks
              </p>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-6 text-lg rounded-full"
              >
                Go to Tasks
              </Button>
            </div>
          </div>

          {/* Post a Batch Button */}
          <div 
            className="group relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-12 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl opacity-75 hover:opacity-90"
            onClick={() => {
              // Future feature - show coming soon toast or navigate to placeholder
              alert('Post a Batch - Coming Soon!\n\nThis feature is under development.');
            }}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/20 transition-all duration-300">
                <Upload size={80} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Post a Batch
              </h2>
              <p className="text-purple-100 text-lg">
                Upload and process multiple files
              </p>
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 py-6 text-lg rounded-full"
              >
                Coming Soon
              </Button>
            </div>
            
            {/* Coming Soon Badge */}
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
              BETA
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-500 text-sm">
          <p>Built by Karl Legson</p>
        </div>
      </div>
    </div>
  );
}

