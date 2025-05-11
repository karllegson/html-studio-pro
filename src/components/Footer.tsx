import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-2 md:py-6" style={{ background: 'hsl(210, 3.20%, 12.20%)', borderTop: '1.5px solid hsl(220, 6%, 16%)', boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.18)' }}>
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-muted-foreground w-full gap-y-1 md:gap-y-0">
          <div className="mb-1 md:mb-0 text-center md:text-left w-full md:w-auto">
            © {new Date().getFullYear()} HTML Studio Pro. All rights reserved.
          </div>
          <div className="flex flex-row flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-1 justify-center w-full md:w-auto text-xs md:text-sm">
            <span>Crafted by Karl Legson</span>
            <span style={{ color: '#b3b3b3', fontSize: '1.1em', lineHeight: 1 }}>•</span>
            <a 
              href="https://github.com/karllegson/html-studio-pro" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span style={{ color: '#b3b3b3', fontSize: '1.1em', lineHeight: 1 }}>•</span>
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