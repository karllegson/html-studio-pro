import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 bg-card/50 border-t border-border/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-2 md:mb-0">
            © {new Date().getFullYear()} HTML Studio Pro. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span>Crafted by Karl Legson</span>
            <span className="text-border">•</span>
            <a 
              href="https://github.com/karllegson/html-studio-pro" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span className="text-border">•</span>
            <a 
              href="/admin" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 