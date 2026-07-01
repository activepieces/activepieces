import { FileProducedEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Download, FileIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ImageDialog } from '@/features/chat/chat-message/image-dialog';
import { cn } from '@/lib/utils';

import { previewUtils } from './previews/preview-utils';

export function FileGroup({ files }: { files: FileProducedEvent[] }) {
  if (files.length > FILE_INLINE_MAX) {
    return <CollapsedFileGrid files={files} />;
  }
  return <FileGrid files={files} />;
}

function CollapsedFileGrid({ files }: { files: FileProducedEvent[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{t('chatOutcomeCount', { count: files.length })}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 opacity-50 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="mt-2">
          <FileGrid files={files} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FileGrid({ files }: { files: FileProducedEvent[] }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const imageFiles = files.filter(isImage);
  const imageSlides = imageFiles.map((file) => ({
    url: file.url,
    caption: file.title ?? file.fileName,
  }));

  const openImage = (file: FileProducedEvent) => {
    const index = imageFiles.findIndex((item) => item.fileId === file.fileId);
    setStartIndex(index < 0 ? 0 : index);
    setViewerOpen(true);
  };

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-2 @xs:grid-cols-2 @lg:grid-cols-3">
        {files.map((file, index) => (
          <FileTile
            key={`${file.fileId}-${index}`}
            file={file}
            onOpenImage={() => openImage(file)}
          />
        ))}
      </div>
      {imageSlides.length > 0 ? (
        <ImageDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          images={imageSlides}
          startIndex={startIndex}
        />
      ) : null}
    </div>
  );
}

function FileTile({
  file,
  onOpenImage,
}: {
  file: FileProducedEvent;
  onOpenImage: () => void;
}) {
  const label = file.title ?? file.fileName;

  if (isImage(file)) {
    return (
      <motion.button
        type="button"
        onClick={onOpenImage}
        className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-muted/40"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <img src={file.url} alt={label} className="size-full object-cover" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2.5 rounded-xl border bg-card p-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FileIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {formatBytes(file.byteSize)}
        </p>
      </div>
      <a href={file.url} download target="_blank" rel="noreferrer">
        <Button variant="ghost" size="icon-sm">
          <Download className="size-4" />
        </Button>
      </a>
    </motion.div>
  );
}

function isImage(file: FileProducedEvent): boolean {
  return previewUtils.detectFileKind(file.mediaType, file.fileName) === 'image';
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
}

const FILE_INLINE_MAX = 6;
