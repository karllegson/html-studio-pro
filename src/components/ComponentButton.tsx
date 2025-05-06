
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTaskContext } from '@/context/TaskContext';

interface ComponentButtonProps {
  label: string;
  template: string;
  onInsert: (html: string) => void;
}

export const ComponentButton: React.FC<ComponentButtonProps> = ({
  label,
  template,
  onInsert
}) => {
  const { currentTask, getCompanyById } = useTaskContext();
  
  const handleClick = () => {
    let html = template;
    
    // Replace {contactLink} placeholder with actual contact link if available
    if (currentTask && currentTask.companyId) {
      const company = getCompanyById(currentTask.companyId);
      if (company) {
        html = html.replace(/{contactLink}/g, company.contactLink);
      }
    }
    
    onInsert(html);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="whitespace-nowrap text-sm"
      onClick={handleClick}
    >
      {label}
    </Button>
  );
};
