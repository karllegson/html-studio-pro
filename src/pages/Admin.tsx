import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useTaskContext } from '@/context/TaskContext';
import { useNavigate } from 'react-router-dom';
import { Home, Tag, Building, FileCode } from 'lucide-react';
import { TemplateManager } from '@/components/admin/TemplateManager';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const SIDEBAR_ITEMS = [
  { key: 'tags', label: 'Tags & Components', icon: <Tag className="mr-2" /> },
  { key: 'companies', label: 'Companies', icon: <Building className="mr-2" /> },
  { key: 'templates', label: 'HTML Templates', icon: <FileCode className="mr-2" /> },
];

const validateCompanyRules = (rules: { basePath: string; prefix: string; fileSuffix: string }) => {
  const errors: string[] = [];

  if (!rules.basePath.endsWith('/')) {
    errors.push('Base path must end with a forward slash (/)');
  }

  if (!rules.fileSuffix.startsWith('-')) {
    errors.push('File suffix must start with a hyphen (-)');
  }

  return errors;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('tags');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState<{ contactLink: string, basePath: string, prefix: string, fileSuffix: string } | null>(null);
  const navigate = useNavigate();

  // Use real companies from context
  const { companies, getCompanyById, updateCompany, deleteCompany, addCompany } = useTaskContext();

  // Placeholder state for tags/components/companies (replace with backend in future)
  const [tags, setTags] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  // State for add company form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    contactLink: '',
    basePath: '',
    prefix: '',
    fileSuffix: ''
  });

  // Update edit fields when company changes
  React.useEffect(() => {
    if (selectedCompany) {
      const company = getCompanyById(selectedCompany);
      setEditCompany(company ? {
        contactLink: company.contactLink,
        basePath: company.basePath,
        prefix: company.prefix,
        fileSuffix: company.fileSuffix
      } : null);
    } else {
      setEditCompany(null);
    }
  }, [selectedCompany, companies]);

  const Sidebar = (
    <div className="w-64 border-r h-screen p-4">
      <div className="space-y-2">
        {SIDEBAR_ITEMS.map(item => (
          <Button
            key={item.key}
            variant={activeTab === item.key ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab(item.key)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate('/')}
        >
          <Home className="mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );

  // --- Tags & Components Content ---
  const TagsComponentsContent = (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Tags & Components</h2>
      <div className="grid grid-cols-2 gap-8">
        {/* Tags Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">HTML Tags</h3>
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between">
                  <span>{tag.name}</span>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full">Add Tag</Button>
            </div>
          </CardContent>
        </Card>

        {/* Components Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">HTML Components</h3>
            <div className="space-y-2">
              {components.map(component => (
                <div key={component.id} className="flex items-center justify-between">
                  <span>{component.name}</span>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full">Add Component</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // --- Companies Content ---
  const handleCompanyFieldChange = (field: string, value: string) => {
    if (editCompany) {
      setEditCompany(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveCompany = async () => {
    if (selectedCompany && editCompany) {
      const errors = validateCompanyRules(editCompany);
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join('\n'),
          variant: "destructive"
        });
        return;
      }

      try {
        await updateCompany(selectedCompany, editCompany);
        toast({
          title: "Company updated",
          description: "The company settings have been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update company settings. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteCompany = () => {
    if (selectedCompany) {
      deleteCompany(selectedCompany);
      setSelectedCompany(null);
    }
  };

  const handleAddCompanyChange = (field: string, value: string) => {
    setNewCompany(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompany.name && newCompany.contactLink) {
      const errors = validateCompanyRules(newCompany);
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join('\n'),
          variant: "destructive"
        });
        return;
      }

      try {
        await addCompany(newCompany);
        setNewCompany({
          name: '',
          contactLink: '',
          basePath: '',
          prefix: '',
          fileSuffix: ''
        });
        setShowAddForm(false);
        toast({
          title: "Company added",
          description: "The company has been added successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add company. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const CompaniesContent = (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Companies</h2>
      <div className="flex gap-8">
        {/* Company List */}
        <div className="w-64">
          <h3 className="text-lg font-medium mb-2">List</h3>
          <div className="flex flex-col gap-2">
            {companies.length === 0 && <div className="text-muted-foreground">No companies found.</div>}
            {companies.map(company => (
              <Button
                key={company.id}
                variant={selectedCompany === company.id ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => setSelectedCompany(company.id)}
              >
                {company.name}
              </Button>
            ))}
            <Button variant="outline" className="mt-2" onClick={() => setShowAddForm(v => !v)}>+ Add Company</Button>
            {showAddForm && (
              <form onSubmit={handleAddCompanySubmit} className="mt-2 flex flex-col gap-2 p-2 border rounded bg-muted">
                <Input
                  type="text"
                  placeholder="Company Name"
                  value={newCompany.name}
                  onChange={e => handleAddCompanyChange('name', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Contact Link"
                  value={newCompany.contactLink}
                  onChange={e => handleAddCompanyChange('contactLink', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Base Path (e.g., https://example.com/wp-content/uploads/)"
                  value={newCompany.basePath}
                  onChange={e => handleAddCompanyChange('basePath', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Prefix (e.g., company_Landing-Page_)"
                  value={newCompany.prefix}
                  onChange={e => handleAddCompanyChange('prefix', e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="File Suffix (e.g., -image.webp)"
                  value={newCompany.fileSuffix}
                  onChange={e => handleAddCompanyChange('fileSuffix', e.target.value)}
                  required
                />
                <Button type="submit" className="bg-primary text-white rounded px-2 py-1">Add</Button>
              </form>
            )}
          </div>
        </div>
        {/* Company Details */}
        {selectedCompany && editCompany ? (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1 font-medium">Contact Link</Label>
                  <Input
                    placeholder="Contact link..."
                    value={editCompany.contactLink}
                    onChange={e => handleCompanyFieldChange('contactLink', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="block mb-1 font-medium">Base Path</Label>
                  <Input
                    placeholder="Base path for images..."
                    value={editCompany.basePath}
                    onChange={e => handleCompanyFieldChange('basePath', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Must end with a forward slash (/)</p>
                </div>
                <div>
                  <Label className="block mb-1 font-medium">Prefix</Label>
                  <Input
                    placeholder="Prefix for filenames..."
                    value={editCompany.prefix}
                    onChange={e => handleCompanyFieldChange('prefix', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="block mb-1 font-medium">File Suffix</Label>
                  <Input
                    placeholder="Suffix for filenames..."
                    value={editCompany.fileSuffix}
                    onChange={e => handleCompanyFieldChange('fileSuffix', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Must start with a hyphen (-)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" onClick={handleSaveCompany}>Save</Button>
                  <Button variant="destructive" onClick={handleDeleteCompany}>Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-muted-foreground mt-12">Select a company to edit its settings.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full">
      {Sidebar}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'tags' && TagsComponentsContent}
        {activeTab === 'companies' && CompaniesContent}
        {activeTab === 'templates' && <TemplateManager />}
      </main>
    </div>
  );
} 