import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ImageUp } from 'lucide-react';
import { DragEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export const ImageUploadDialog = ({
  title,
  description,
  maxSizeMb,
  open,
  onOpenChange,
  onConfirm,
}: ImageUploadDialogProps) => {
  const [selection, setSelection] = useState<ImageSelection | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const browseInputRef = useRef<HTMLInputElement>(null);

  const selectImage = (files: FileList | null | undefined) => {
    const file = files?.[0];
    if (isNil(file)) {
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      replaceSelection(null);
      setRejectionMessage(
        t('That file type is not supported. Use PNG, JPEG or WebP.'),
      );
      return;
    }
    if (file.size > maxSizeMb * BYTES_PER_MB) {
      replaceSelection(null);
      setRejectionMessage(
        t('That image is larger than {size}MB.', { size: maxSizeMb }),
      );
      return;
    }
    setRejectionMessage(null);
    replaceSelection({ file, previewUrl: URL.createObjectURL(file) });
  };

  const replaceSelection = (next: ImageSelection | null) => {
    setSelection((previous) => {
      if (!isNil(previous)) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      return next;
    });
  };

  useEffect(
    () => () => {
      if (!isNil(selection)) {
        URL.revokeObjectURL(selection.previewUrl);
      }
    },
    [selection],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    selectImage(event.dataTransfer.files);
  };

  const confirmSelection = () => {
    if (isNil(selection)) {
      return;
    }
    onConfirm(selection.file);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        replaceSelection(null);
        setIsDraggingOver(false);
        setRejectionMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          aria-label={t('Choose an image')}
          onClick={() => browseInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              browseInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={cn(
            'my-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            isDraggingOver
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-accent',
          )}
        >
          {isNil(selection) ? (
            <>
              <ImageUp className="size-7 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  {t('Drag and drop an image here')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('or click to browse your files')}
                </span>
              </div>
            </>
          ) : (
            <>
              <img
                src={selection.previewUrl}
                alt={selection.file.name}
                className="max-h-28 max-w-full object-contain"
              />
              <span className="max-w-full truncate text-xs text-muted-foreground">
                {selection.file.name}
              </span>
            </>
          )}
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            ref={browseInputRef}
            className="hidden"
            onChange={(event) => selectImage(event.target.files)}
          />
        </div>

        {!isNil(rejectionMessage) && (
          <p role="alert" className="text-sm text-destructive">
            {rejectionMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            disabled={isNil(selection)}
            onClick={confirmSelection}
          >
            {t('Select')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BYTES_PER_MB = 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

type ImageSelection = {
  file: File;
  previewUrl: string;
};

type ImageUploadDialogProps = {
  title: string;
  description: string;
  maxSizeMb: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => void;
};
