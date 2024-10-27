import { Download, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
}

export const ImageDialog: React.FC<ImageDialogProps> = ({
  open,
  onOpenChange,
  imageUrl,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        withCloseButton={false}
        className="bg-transparent border-none shadow-none flex items-center justify-center"
      >
        <div className="relative">
          <img
            src={imageUrl || ''}
            alt="Full size image"
            className="h-auto object-contain max-h-[90vh] sm:max-w-[90vw] shadow-sm"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl || '';
                link.download = 'image';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <DialogClose>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
