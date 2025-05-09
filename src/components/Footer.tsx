import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6" style={{ background: 'hsl(210, 3.20%, 12.20%)', borderTop: '1.5px solid hsl(220, 6%, 16%)', boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.18)' }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-2 md:mb-0">
            © {new Date().getFullYear()} HTML Studio Pro. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span>Crafted by Karl Legson</span>
            <span style={{ color: '#b3b3b3', fontSize: '1.25em', lineHeight: 1 }}>•</span>
            <a 
              href="https://github.com/karllegson/html-studio-pro" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span style={{ color: '#b3b3b3', fontSize: '1.25em', lineHeight: 1 }}>•</span>
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