import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Camera, ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { RefObject, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ACCEPTED_IMAGE_TYPES, ImageUploadDialog } from './image-upload-dialog';

export const ImageUploadField = ({
  title,
  description,
  currentUrl,
  inputRef,
  shape = 'square',
  locked = false,
  onLocked,
  previewClassName,
}: ImageUploadFieldProps) => {
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const previewUrl = pendingPreviewUrl ?? currentUrl;

  useEffect(
    () => () => {
      if (!isNil(pendingPreviewUrl)) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    },
    [pendingPreviewUrl],
  );

  const applyFile = (file: File) => {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (!isNil(inputRef.current)) {
      inputRef.current.files = transfer.files;
    }
    setPendingPreviewUrl(URL.createObjectURL(file));
  };

  const clearPendingFile = () => {
    if (!isNil(inputRef.current)) {
      inputRef.current.value = '';
    }
    setPendingPreviewUrl(null);
  };

  const openUpload = () => (locked ? onLocked() : setIsDialogOpen(true));

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={openUpload}
        aria-label={
          locked
            ? t('Upgrade to change {name}', { name: title })
            : t('Change {name}', { name: title })
        }
        className={cn(
          'group relative mt-0.5 flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-muted/40 outline-none transition-colors hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          shape === 'round' && 'rounded-full',
          previewClassName,
          locked && 'opacity-60',
          !isNil(pendingPreviewUrl) && 'border-primary ring-2 ring-primary/20',
        )}
      >
        {isNil(previewUrl) ? (
          <ImageIcon className="size-5 text-muted-foreground" />
        ) : (
          <img
            src={previewUrl}
            alt={title}
            className="size-full object-contain p-2"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Pencil className="size-4 text-background" />
        </span>
      </button>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          {isNil(pendingPreviewUrl) ? (
            <span className="text-sm text-muted-foreground">{description}</span>
          ) : (
            <span className="text-sm font-medium text-primary">
              {t('Pending — press Save to apply')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openUpload}
          >
            <Camera className="size-3.5" />
            {t('Replace')}
          </Button>
          {!isNil(pendingPreviewUrl) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={clearPendingFile}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={inputRef}
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
      />

      <ImageUploadDialog
        title={t('Change {name}', { name: title })}
        description={description}
        maxSizeMb={MAX_IMAGE_SIZE_MB}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={applyFile}
      />
    </div>
  );
};

export const MAX_IMAGE_SIZE_MB = 10;

type ImageUploadFieldProps = {
  title: string;
  description: string;
  currentUrl?: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  shape?: 'square' | 'round';
  locked?: boolean;
  onLocked: () => void;
  previewClassName?: string;
};
