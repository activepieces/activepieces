import { t } from 'i18next';
import { Download, X } from 'lucide-react';
import React from 'react';

import { ImageWithFallback } from '@/components/custom/image-with-fallback';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { downloadImage } from './download-image';

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
        size="xxl"
        showCloseButton={false}
        className="flex items-center justify-center border-none bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">{t('Image preview')}</DialogTitle>
        <div className="relative flex items-center justify-center">
          <ImageWithFallback
            src={imageUrl ?? ''}
            alt={t('Image preview')}
            className="max-h-[85vh] max-w-[90vw] h-auto w-auto rounded-md"
            imageClassName="max-h-[85vh] max-w-[90vw] h-auto w-auto rounded-md"
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              title={t('Download')}
              onClick={() => imageUrl && downloadImage(imageUrl)}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">{t('Download')}</span>
            </Button>
            <Button
              size="icon"
              variant="secondary"
              title={t('Close')}
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('Close')}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
