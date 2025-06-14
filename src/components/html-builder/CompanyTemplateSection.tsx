import React from 'react';
import { Button } from '@/components/ui/button';
import { useTaskContext } from '@/context/TaskContext';
import { Copy, ArrowDown, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskType } from '@/types';

interface CompanyTemplateSectionProps {
  companyId: string;
  pageType: TaskType;
  onInsertTemplate: (template: string) => void;
}

export const CompanyTemplateList: React.FC<CompanyTemplateSectionProps> = ({
  companyId,
  pageType,
  onInsertTemplate,
}) => {
  const { getCompanyById, getTemplatesByCompany, getTemplatesByPageType } = useTaskContext();
  const { toast } = useToast();
  
  const company = getCompanyById(companyId);
  const companyTemplates = getTemplatesByCompany(companyId);
  const pageTypeTemplates = getTemplatesByPageType(pageType);
  
  // Filter templates that are both for this company and page type
  const availableTemplates = companyTemplates.filter(template => 
    template.pageType === pageType && template.isActive
  );

  const handleCopyTemplate = (template: string) => {
    navigator.clipboard.writeText(template);
    toast({
      title: "Template copied",
      description: "HTML template has been copied to your clipboard.",
      duration: 2000,
    });
  };

  const handleOpenInNewTab = (template: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Template Preview</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />
            <style>
              body { background: #18181b; color: #fff; margin: 0; padding: 0; }
              pre { margin: 0; padding: 2em; font-size: 1.1em; }
            </style>
          </head>
          <body>
            <pre><code class="language-html">${escapeHtml(template)}</code></pre>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js"></script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  function escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">HTML Templates</h3>
      <div className="space-y-2">
        {availableTemplates.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No templates available for this company and page type.
          </div>
        ) : (
          availableTemplates.map(template => (
            <div key={template.id} className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 flex justify-between items-center"
                onClick={() => handleCopyTemplate(template.content)}
              >
                <span>{template.name}</span>
                <Copy size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={() => onInsertTemplate(template.content)}
                title="Insert into editor"
              >
                <ArrowDown size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenInNewTab(template.content)}
                title="Open template in new tab"
              >
                <ExternalLink size={16} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
