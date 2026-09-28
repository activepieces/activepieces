import { Cancel01Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
        showCloseButton={false}
        className="flex w-auto max-w-[90vw] items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]"
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
              variant="accent"
              title={t('Download')}
              onClick={() => imageUrl && downloadImage(imageUrl)}
            >
              <HugeiconsIcon icon={Download04Icon} className="h-4 w-4" />
              <span className="sr-only">{t('Download')}</span>
            </Button>
            <Button
              size="icon"
              variant="accent"
              title={t('Close')}
              onClick={() => onOpenChange(false)}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              <span className="sr-only">{t('Close')}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
