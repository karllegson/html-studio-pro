import { useState, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const STORAGE_KEY = 'google_sheets_name';

export function getSheetName(): string {
  return localStorage.getItem(STORAGE_KEY) || 'Posting 022';
}

export function setSheetName(name: string): void {
  localStorage.setItem(STORAGE_KEY, name);
}

export function SheetNameConfig() {
  const [open, setOpen] = useState(false);
  const [sheetName, setSheetNameLocal] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSheetNameLocal(getSheetName());
  }, [open]);

  const handleSave = () => {
    setSheetName(sheetName);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      // Reload the page to fetch new data
      window.location.reload();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Sheet Name</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-name">Google Sheet Name</Label>
            <Input
              id="sheet-name"
              placeholder="Posting 022"
              value={sheetName}
              onChange={(e) => setSheetNameLocal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the exact name of your sheet tab (e.g., "Posting 022", "Posting 023")
            </p>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saved}>
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              'Save & Reload'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


