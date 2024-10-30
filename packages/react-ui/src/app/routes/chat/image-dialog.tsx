import { Download, X } from 'lucide-react';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';

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
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);
  return open ? (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center transition-colors duration-300"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onOpenChange(false);
      }}
    >
      <div className="bg-transparent border-none shadow-none flex items-center justify-center px-4">
        <div className="relative">
          <img
            src={imageUrl || ''}
            alt="Full size image"
            className="h-auto object-contain max-h-[90vh] sm:max-w-[90vw] shadow-sm rounded-md"
          />
        </div>
        <div className="flex gap-2 absolute top-2 right-2">
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
          <Button
            size="icon"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ) : null;
};
