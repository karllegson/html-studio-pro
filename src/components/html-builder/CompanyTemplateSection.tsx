import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTaskContext } from '@/context/TaskContext';
import { Copy, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompanyTemplateSectionProps {
  companyId: string;
  onInsertTemplate: (template: string) => void;
}

export const CompanyTemplateSection: React.FC<CompanyTemplateSectionProps> = ({
  companyId,
  onInsertTemplate,
}) => {
  const { getCompanyById } = useTaskContext();
  const { toast } = useToast();
  
  const company = getCompanyById(companyId);
  
  const generateBaseTemplate = () => {
    const contactLink = company?.contactLink || '#';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${company?.name || 'Company'} - Page Title</title>
</head>
<body>
  <!-- Header Section -->
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/services">Services</a>
      <a href="${contactLink}">Contact</a>
    </nav>
  </header>

  <!-- Main Content -->
  <main>
    <h1>Main Heading</h1>
    <p>Your content here...</p>
  </main>

  <!-- Footer Section -->
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${company?.name || 'Company'}. All rights reserved.</p>
    <a href="${contactLink}">Contact Us</a>
  </footer>
</body>
</html>`;
  };

  const handleCopyTemplate = () => {
    const template = generateBaseTemplate();
    navigator.clipboard.writeText(template);
    toast({
      title: "Template copied",
      description: "HTML template has been copied to your clipboard.",
      duration: 2000,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-2">HTML Templates</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 flex justify-between items-center"
              onClick={handleCopyTemplate}
            >
              <span>Basic HTML Structure</span>
              <Copy size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => onInsertTemplate(generateBaseTemplate())}
              title="Insert into editor"
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
