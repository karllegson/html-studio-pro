import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="mb-2 md:mb-0">
            © {new Date().getFullYear()} HTML Studio Pro. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span>Crafted by Karl Legson</span>
            <span className="text-gray-600">•</span>
            <a href="https://github.com/karllegson/html-studio-pro" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              GitHub
            </a>
            <span className="text-gray-600">•</span>
            <a href="/admin" className="ml-2 text-xs text-gray-500 hover:text-primary underline underline-offset-2 transition-colors">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 