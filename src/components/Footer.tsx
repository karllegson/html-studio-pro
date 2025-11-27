import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-3 sm:py-4 md:py-8 min-h-[56px]" style={{ background: 'hsl(210, 3.20%, 12.20%)', borderTop: '1.5px solid hsl(220, 6%, 16%)', boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.18)' }}>
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 text-xs sm:text-sm text-muted-foreground w-full">
          <div className="text-center sm:text-left order-2 sm:order-1">
            © {new Date().getFullYear()} HTML Studio Pro. All rights reserved.
          </div>
          <div className="flex flex-row flex-wrap items-center justify-center sm:justify-end gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-1 text-xs sm:text-sm order-1 sm:order-2">
            <span>Crafted by Karl Legson</span>
            <span className="hidden sm:inline" style={{ color: '#b3b3b3', fontSize: '1.1em', lineHeight: 1 }}>•</span>
            <a 
              href="https://github.com/karllegson/html-studio-pro" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span className="hidden sm:inline" style={{ color: '#b3b3b3', fontSize: '1.1em', lineHeight: 1 }}>•</span>
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