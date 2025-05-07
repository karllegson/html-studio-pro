import React, { useState, useEffect } from 'react';
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
import { ImageFilenameConverter } from '@/components/html-builder/ImageFilenameConverter';
import { getCompanyTags, setCompanyTags, subscribeToCompanyTags, CompanyTags } from '@/utils/companyTags';

const SIDEBAR_ITEMS = [
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
  const [activeTab, setActiveTab] = useState('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState<{ contactLink: string, basePath: string, prefix: string, fileSuffix: string } | null>(null);
  const navigate = useNavigate();

  // Use real companies from context
  const { companies, getCompanyById, updateCompany, deleteCompany, addCompany } = useTaskContext();

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
    <div className="w-64 border-r h-screen p-4 bg-background flex flex-col">
      <Button
        variant="outline"
        className="w-full justify-start mb-6 font-semibold text-base border-2 border-primary text-primary bg-white hover:bg-primary/10 shadow-sm"
        onClick={() => navigate('/')}
      >
        <Home className="mr-2" />
        Back to Dashboard
      </Button>
      <div className="space-y-2">
        {SIDEBAR_ITEMS.map(item => (
          <Button
            key={item.key}
            variant={activeTab === item.key ? 'default' : 'ghost'}
            className="w-full justify-start text-base"
            onClick={() => setActiveTab(item.key)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
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
    if (!newCompany.name) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive"
      });
      return;
    }
    // Don't validate other fields for new company
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
  };

  const CompaniesContent = (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Companies</h2>
      <div className="flex gap-8">
        {/* Company List */}
        <Card className="w-72 min-w-[260px] shadow-md bg-card border border-border">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 text-white/90">List</h3>
            <div className="flex flex-col gap-2">
              {companies.length === 0 && <div className="text-muted-foreground">No companies found.</div>}
              {companies.map(company => (
                <Button
                  key={company.id}
                  variant={selectedCompany === company.id ? 'default' : 'ghost'}
                  className={`justify-start rounded-lg transition-all ${selectedCompany === company.id ? 'bg-primary/90 text-white' : 'hover:bg-primary/20 bg-muted text-white/80'} text-base`}
                  onClick={() => setSelectedCompany(company.id)}
                >
                  {company.name}
                </Button>
              ))}
              <Button variant="outline" className="mt-4 font-semibold text-primary border-primary border-2 hover:bg-primary/20 bg-muted text-white/80" onClick={() => setShowAddForm(v => !v)}>+ Add Company</Button>
              {showAddForm && (
                <form onSubmit={handleAddCompanySubmit} className="mt-2 flex flex-col gap-2 p-3 border rounded-lg bg-muted/40 shadow-sm">
                  <Input
                    type="text"
                    placeholder="Company Name"
                    value={newCompany.name}
                    onChange={e => handleAddCompanyChange('name', e.target.value)}
                    required
                    className="bg-muted text-white/90 border border-border"
                  />
                  <Input
                    type="text"
                    placeholder="Contact Link"
                    value={newCompany.contactLink}
                    onChange={e => handleAddCompanyChange('contactLink', e.target.value)}
                    className="bg-muted text-white/90 border border-border"
                  />
                  <Input
                    type="text"
                    placeholder="Base Path (e.g., https://example.com/wp-content/uploads/)"
                    value={newCompany.basePath}
                    onChange={e => handleAddCompanyChange('basePath', e.target.value)}
                    className="bg-muted text-white/90 border border-border"
                  />
                  <Input
                    type="text"
                    placeholder="Prefix (e.g., company_Landing-Page_)"
                    value={newCompany.prefix}
                    onChange={e => handleAddCompanyChange('prefix', e.target.value)}
                    className="bg-muted text-white/90 border border-border"
                  />
                  <Input
                    type="text"
                    placeholder="File Suffix (e.g., -image.webp)"
                    value={newCompany.fileSuffix}
                    onChange={e => handleAddCompanyChange('fileSuffix', e.target.value)}
                    className="bg-muted text-white/90 border border-border"
                  />
                  <Button type="submit" className="bg-primary text-white rounded px-2 py-1 mt-2">Add</Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Company Details */}
        {selectedCompany && editCompany ? (
          <Card className="flex-1 max-w-xl shadow-lg bg-card border border-border">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4 text-white/90">Settings</h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label className="block mb-1 font-medium text-white/80">Contact Link</Label>
                  <Input
                    placeholder="Contact link..."
                    value={editCompany.contactLink}
                    onChange={e => handleCompanyFieldChange('contactLink', e.target.value)}
                    className="bg-muted text-white/90 border border-border"
                  />
                </div>
                <hr className="my-4 border-t border-gray-700" />
                <div className="mb-2 text-base font-semibold text-white/80">Image name to link converter Settings</div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="block mb-1 font-medium text-white/80">Base Path</Label>
                    <Input
                      placeholder="Base path for images..."
                      value={editCompany.basePath}
                      onChange={e => handleCompanyFieldChange('basePath', e.target.value)}
                      className="bg-muted text-white/90 border border-border"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Must end with a forward slash (/)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="block mb-1 font-medium text-white/80">Prefix</Label>
                    <Input
                      placeholder="Prefix for filenames..."
                      value={editCompany.prefix}
                      onChange={e => handleCompanyFieldChange('prefix', e.target.value)}
                      className="bg-muted text-white/90 border border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="block mb-1 font-medium text-white/80">File Suffix</Label>
                    <Input
                      placeholder="Suffix for filenames..."
                      value={editCompany.fileSuffix}
                      onChange={e => handleCompanyFieldChange('fileSuffix', e.target.value)}
                      className="bg-muted text-white/90 border border-border"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Must start with a hyphen (-)</p>
                  </div>
                </div>
                <div className="pt-4">
                  <ImageFilenameConverter companyId={selectedCompany} displayOutputAsText />
                </div>
                <hr className="my-6 border-t border-gray-700" />
                {/* Tag Editor Section */}
                <AdminCompanyTagsEditor companyId={selectedCompany} />
                <div className="flex gap-2 mt-6">
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
        {activeTab === 'companies' && CompaniesContent}
        {activeTab === 'templates' && <TemplateManager />}
      </main>
    </div>
  );
}

// --- AdminCompanyTagsEditor component ---
function AdminCompanyTagsEditor({ companyId }: { companyId: string }) {
  const [tags, setTags] = useState<CompanyTags | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewInput, setReviewInput] = useState('');
  const [faqInput, setFaqInput] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToCompanyTags(companyId, (data) => {
      setTags(data || { reviewTags: [], faqTags: [] });
      setLoading(false);
    });
    return () => unsub();
  }, [companyId]);

  const handleAddTag = async (type: 'reviewTags' | 'faqTags') => {
    if (!tags) return;
    const input = type === 'reviewTags' ? reviewInput : faqInput;
    if (!input.trim()) return;
    const newTags = { ...tags, [type]: [...tags[type], input.trim()] };
    await setCompanyTags(companyId, newTags);
    if (type === 'reviewTags') setReviewInput('');
    else setFaqInput('');
  };

  const handleDeleteTag = async (type: 'reviewTags' | 'faqTags', idx: number) => {
    if (!tags) return;
    const newArr = tags[type].filter((_, i) => i !== idx);
    await setCompanyTags(companyId, { ...tags, [type]: newArr });
  };

  return (
    <div className="bg-muted/40 rounded-lg p-4 border border-border">
      <h4 className="text-lg font-semibold mb-4 text-white/90">Company Tags</h4>
      {loading ? (
        <div className="text-muted-foreground">Loading tags...</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Review Tags */}
          <div>
            <div className="font-medium mb-2 text-white/80">Review Tags</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags?.reviewTags.map((tag, idx) => (
                <span key={tag + idx} className="bg-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  <button
                    className="ml-1 text-xs text-red-400 hover:text-red-600"
                    onClick={() => handleDeleteTag('reviewTags', idx)}
                    title="Delete tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={reviewInput}
                onChange={e => setReviewInput(e.target.value)}
                placeholder="Add review tag"
                className="bg-card text-white/90 border border-border"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag('reviewTags'); } }}
              />
              <Button size="sm" onClick={() => handleAddTag('reviewTags')}>Add</Button>
            </div>
          </div>
          {/* FAQ Tags */}
          <div>
            <div className="font-medium mb-2 text-white/80">FAQ Tags</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags?.faqTags.map((tag, idx) => (
                <span key={tag + idx} className="bg-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  <button
                    className="ml-1 text-xs text-red-400 hover:text-red-600"
                    onClick={() => handleDeleteTag('faqTags', idx)}
                    title="Delete tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={faqInput}
                onChange={e => setFaqInput(e.target.value)}
                placeholder="Add FAQ tag"
                className="bg-card text-white/90 border border-border"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag('faqTags'); } }}
              />
              <Button size="sm" onClick={() => handleAddTag('faqTags')}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 