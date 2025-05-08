import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (url: string) => void;
  selectedText: string;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  selectedText,
}) => {
  const [url, setUrl] = React.useState("");

  const handleConfirm = () => {
    onConfirm(url);
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Selected text:</p>
            <p className="font-mono bg-muted px-2 py-1 rounded text-primary border border-border break-all">
              {selectedText || <span className="italic text-muted-foreground">No text selected</span>}
            </p>
          </div>
          <div>
            <label htmlFor="url" className="text-sm text-muted-foreground mb-2 block">
              URL:
            </label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!url}>
            Add Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 