import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaskContext } from '@/context/TaskContext';
import { TaskType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


export const TemplateManager: React.FC = () => {
  const { 
    companies, 
    templates, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate,
    getTemplatesByCompany,
    getBlogTemplatesFromAllCompanies
  } = useTaskContext();
  const { toast } = useToast();

  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    content: '',
    pageType: TaskType.BLOG,
    isActive: true,
    companyId: ''
  });

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    setSelectedTemplate(null);
    setEditMode('add');
    setTemplateForm({
      name: '',
      description: '',
      content: '',
      pageType: companyId === 'universal-blog' ? TaskType.BLOG : TaskType.BLOG,
      isActive: true,
      companyId: ''
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setEditMode('edit');
      setTemplateForm({
        name: template.name,
        description: template.description,
        content: template.content,
        pageType: template.pageType,
        isActive: template.isActive,
        companyId: template.companyId
      });
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setTemplateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode === 'add') {
        const companyId = selectedCompany === 'universal-blog' 
          ? templateForm.companyId 
          : selectedCompany;
        
        if (!companyId) {
          toast({
            title: "Error",
            description: "Please select a company for this template.",
            variant: "destructive"
          });
          return;
        }

        await addTemplate({
          ...templateForm,
          companyId: companyId
        });
        toast({
          title: "Template added",
          description: "The template has been added successfully.",
        });
      } else if (selectedTemplate) {
        await updateTemplate(selectedTemplate, templateForm);
        toast({
          title: "Template updated",
          description: "The template has been updated successfully.",
        });
      }
      // Reset form
      setTemplateForm({
        name: '',
        description: '',
        content: '',
        pageType: TaskType.BLOG,
        isActive: true,
        companyId: ''
      });
      setEditMode('add');
      setSelectedTemplate(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (selectedTemplate) {
      try {
        await deleteTemplate(selectedTemplate);
        toast({
          title: "Template deleted",
          description: "The template has been deleted successfully.",
        });
        setSelectedTemplate(null);
        setEditMode('add');
        setTemplateForm({
          name: '',
          description: '',
          content: '',
          pageType: TaskType.BLOG,
          isActive: true,
          companyId: ''
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete template. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const companyTemplates = selectedCompany === 'universal-blog' 
    ? getBlogTemplatesFromAllCompanies()
    : selectedCompany 
      ? getTemplatesByCompany(selectedCompany) 
      : [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">HTML Templates</h2>
      <div className="flex gap-8">
        {/* Company List */}
        <div className="w-64">
          <h3 className="text-lg font-medium mb-2">Companies</h3>
          <div className="flex flex-col gap-2">
            <Button
              variant={selectedCompany === 'universal-blog' ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => handleCompanyChange('universal-blog')}
            >
              Universal Blog Templates
            </Button>
            {companies.map(company => (
              <Button
                key={company.id}
                variant={selectedCompany === company.id ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => handleCompanyChange(company.id)}
              >
                {company.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Template List and Editor */}
        <div className="flex-1">
          {selectedCompany ? (
            <div className="space-y-4">
              {/* Template List */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-2">Templates</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {companyTemplates.map(template => {
                        const templateCompany = companies.find(c => c.id === template.companyId);
                        return (
                          <Button
                            key={template.id}
                            variant={selectedTemplate === template.id ? 'default' : 'outline'}
                            className="w-full justify-start"
                            onClick={() => handleTemplateSelect(template.id)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col items-start">
                                <span>{template.name}</span>
                                {selectedCompany !== 'universal-blog' && templateCompany && (
                                  <span className="text-xs text-muted-foreground">
                                    {templateCompany.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {template.pageType}
                              </span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Template Editor */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    {editMode === 'add' ? 'Add New Template' : 'Edit Template'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {selectedCompany === 'universal-blog' && editMode === 'add' && (
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Select
                          value={templateForm.companyId || ''}
                          onValueChange={value => handleFormChange('companyId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company for this blog template" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map(company => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground">
                          This template will be available for all companies when creating blog posts.
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={templateForm.name}
                        onChange={e => handleFormChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={templateForm.description}
                        onChange={e => handleFormChange('description', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pageType">Page Type</Label>
                      <Select
                        value={templateForm.pageType}
                        onValueChange={value => handleFormChange('pageType', value as TaskType)}
                        disabled={selectedCompany === 'universal-blog'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaskType.BLOG}>Blog Post</SelectItem>
                          <SelectItem value={TaskType.SUB_PAGE}>Sub Page</SelectItem>
                          <SelectItem value={TaskType.LANDING_PAGE}>Landing Page</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedCompany === 'universal-blog' && (
                        <p className="text-xs text-muted-foreground">
                          Universal blog templates are always set to "Blog Post"
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">HTML Content</Label>
                      <Textarea
                        id="content"
                        value={templateForm.content}
                        onChange={e => handleFormChange('content', e.target.value)}
                        className="font-mono h-[300px]"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={templateForm.isActive}
                        onCheckedChange={checked => handleFormChange('isActive', checked)}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        {editMode === 'add' ? 'Add Template' : 'Update Template'}
                      </Button>
                      {editMode === 'edit' && (
                        <Button type="button" variant="destructive" onClick={handleDelete}>
                          Delete Template
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Select a company to manage its templates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 