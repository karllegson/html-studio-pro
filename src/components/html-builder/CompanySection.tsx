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
import CopyButton from '@/components/ui/CopyButton';

interface CompanySectionProps {
  companyId: string;
  pageType: string;
  teamworkLink: string;
  googleDocLink: string;
  onCompanyChange: (value: string) => void;
  onPageTypeChange: (value: string) => void;
  onTeamworkLinkChange: (value: string) => void;
  onGoogleDocLinkChange: (value: string) => void;
}

export const CompanySection: React.FC<CompanySectionProps> = ({
  companyId,
  pageType,
  teamworkLink,
  googleDocLink,
  onCompanyChange,
  onPageTypeChange,
  onTeamworkLinkChange,
  onGoogleDocLinkChange,
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
        <div className="space-y-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 w-full">
            <Label htmlFor="company" className="w-full sm:w-28 text-xs sm:text-sm font-medium whitespace-nowrap truncate">Company</Label>
            <Select value={companyId} onValueChange={onCompanyChange}>
              <SelectTrigger id="company" className="w-full">
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
        </div>
        <div className="space-y-0.5 mt-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 w-full">
            <Label htmlFor="pageType" className="w-full sm:w-28 text-xs sm:text-sm font-medium whitespace-nowrap truncate">Page Type</Label>
            <Select value={pageType} onValueChange={onPageTypeChange}>
              <SelectTrigger id="pageType" className="w-full">
                <SelectValue placeholder="Select page type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Landing Page">Landing Page</SelectItem>
                <SelectItem value="Sub Page">Sub Page</SelectItem>
                <SelectItem value="Blog Post">Blog Post</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-0.5 mt-1">
          <Label htmlFor="teamworkLink">Teamwork Link</Label>
          <div className="flex gap-2">
            <Input
              id="teamworkLink"
              value={teamworkLink}
              onChange={e => onTeamworkLinkChange(e.target.value)}
              className="font-mono text-xs"
              placeholder="Paste Teamwork link"
            />
            <CopyButton value={teamworkLink} />
          </div>
        </div>
        <div className="space-y-0.5 mt-1">
          <Label htmlFor="googleDocLink">Google Doc Link</Label>
          <div className="flex gap-2">
            <Input
              id="googleDocLink"
              value={googleDocLink}
              onChange={e => onGoogleDocLinkChange(e.target.value)}
              className="font-mono text-xs"
              placeholder="Paste Google Doc link"
            />
            <CopyButton value={googleDocLink} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
