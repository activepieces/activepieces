import { FileProducedEvent } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { Download, FileIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageDialog } from '@/features/chat/chat-message/image-dialog';

import { byteFormatUtils } from '../lib/format-bytes';

import { DocumentPreview } from './previews/document-preview';
import { HtmlPreview } from './previews/html-preview';
import { JsonPreview } from './previews/json-preview';
import { previewUtils } from './previews/preview-utils';
import { SpreadsheetPreview } from './previews/spreadsheet-preview';

const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;

function selectTextPreview(
  kind: ReturnType<typeof previewUtils.detectFileKind>,
  content: string,
  label: string,
  fileName: string,
) {
  switch (kind) {
    case 'csv': {
      const table = previewUtils.parseCsv(content);
      return table ? (
        <SpreadsheetPreview table={table} label={label} fileName={fileName} />
      ) : null;
    }
    case 'json': {
      const parsed = previewUtils.parseJsonSafe(content);
      return parsed.ok ? (
        <JsonPreview data={parsed.value} label={label} fileName={fileName} />
      ) : null;
    }
    case 'html':
      return <HtmlPreview html={content} label={label} fileName={fileName} />;
    case 'markdown':
    case 'text':
      return (
        <DocumentPreview markdown={content} label={label} fileName={fileName} />
      );
    default:
      return null;
  }
}

function FileChip({ file }: { file: FileProducedEvent }) {
  const label = file.title ?? file.fileName;
  const size = byteFormatUtils.formatBytes(file.byteSize);
  return (
    <motion.div
      className="flex max-w-md items-center gap-3 rounded-xl border bg-card p-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FileIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {file.mediaType}
          {size ? ` · ${size}` : ''}
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

export function ProducedFileCard({ file }: { file: FileProducedEvent }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const kind = previewUtils.detectFileKind(file.mediaType, file.fileName);
  const canPreview =
    kind !== 'image' && kind !== 'binary' && file.byteSize <= MAX_PREVIEW_BYTES;

  const {
    data: content,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['chat-produced-file', file.fileId],
    queryFn: async () => {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Failed to load file');
      return response.text();
    },
    enabled: canPreview,
    staleTime: Infinity,
    retry: 1,
  });

  const label = file.title ?? file.fileName;

  if (kind === 'image') {
    const size = byteFormatUtils.formatBytes(file.byteSize);
    return (
      <>
        <motion.div
          className="max-w-md overflow-hidden rounded-xl border bg-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="block w-full cursor-pointer"
          >
            <img src={file.url} alt={label} className="h-auto w-full" />
          </button>
          <div className="flex items-center justify-between gap-2 p-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {label}
              {size ? ` · ${size}` : ''}
            </p>
            <a href={file.url} download target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon-sm">
                <Download className="size-4" />
              </Button>
            </a>
          </div>
        </motion.div>
        <ImageDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          imageUrl={file.url}
        />
      </>
    );
  }

  if (canPreview && !isError) {
    if (isLoading || content === undefined) {
      return (
        <div className="w-full overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="p-3">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      );
    }

    const previewElement = selectTextPreview(
      kind,
      content,
      label,
      previewUtils.baseFileName(file.fileName),
    );
    if (previewElement) return previewElement;
  }

  return <FileChip file={file} />;
}
