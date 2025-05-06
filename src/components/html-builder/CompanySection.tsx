
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { useTaskContext } from '@/context/TaskContext';
import { Copy } from 'lucide-react';

interface CompanySectionProps {
  companyId: string;
  contactLink: string;
  pageType: string;
  onCompanyChange: (value: string) => void;
  onContactLinkChange: (value: string) => void;
  onCopyToClipboard: (text: string) => void;
  onPageTypeChange: (value: string) => void;
}

export const CompanySection: React.FC<CompanySectionProps> = ({
  companyId,
  contactLink,
  pageType,
  onCompanyChange,
  onContactLinkChange,
  onCopyToClipboard,
  onPageTypeChange,
}) => {
  const { companies } = useTaskContext();

  const selectedCompany = companies.find(company => company.id === companyId);

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Show the company name prominently */}
        {selectedCompany && (
          <h2 className="text-2xl font-bold mb-4 text-primary">
            {selectedCompany.name}
            {pageType && (
              <span className="ml-2 text-sm bg-secondary px-2 py-1 rounded-md">
                {pageType}
              </span>
            )}
          </h2>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Select value={companyId} onValueChange={onCompanyChange}>
            <SelectTrigger id="company">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 mt-4">
          <Label htmlFor="pageType">Page Type</Label>
          <Select value={pageType} onValueChange={onPageTypeChange}>
            <SelectTrigger id="pageType">
              <SelectValue placeholder="Select page type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Landing Page">Landing Page</SelectItem>
              <SelectItem value="Sub Page">Sub Page</SelectItem>
              <SelectItem value="Blog Post">Blog Post</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 mt-4">
          <Label htmlFor="contactLink">Contact Us Link</Label>
          <div className="flex gap-2">
            <Input 
              id="contactLink" 
              value={contactLink} 
              onChange={(e) => onContactLinkChange(e.target.value)} 
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => onCopyToClipboard(contactLink)}
              className="flex-shrink-0"
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
