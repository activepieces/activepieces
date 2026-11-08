import { FileProducedEvent } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Download, FileIcon, ImageIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { ChatCard, ChatCardHeader, ChatCardTile } from './chat-ui/chat-card';
import { ChatImage } from './chat-ui/chat-image';
import { DocumentPreview } from './previews/document-preview';
import { HtmlPreview } from './previews/html-preview';
import { JsonPreview } from './previews/json-preview';
import { PreviewCard, PreviewIconButton } from './previews/preview-card';
import { FileKind, previewUtils } from './previews/preview-utils';
import { SpreadsheetPreview } from './previews/spreadsheet-preview';

export function ProducedFileCard({ file }: { file: FileProducedEvent }) {
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
  const meta = fileMeta(file);

  if (kind === 'image') {
    return (
      <PreviewCard
        icon={ImageIcon}
        label={label}
        meta={meta}
        actions={[
          {
            id: 'download',
            icon: Download,
            label: t('Download'),
            href: file.url,
          },
        ]}
        className="max-w-md"
      >
        <div className="p-3">
          <ChatImage src={file.url} alt={label} />
        </div>
      </PreviewCard>
    );
  }

  if (canPreview && !isError) {
    if (isLoading || content === undefined) {
      return (
        <ChatCard className="my-3 w-full overflow-hidden">
          <ChatCardHeader
            tile={<ChatCardTile kind="file" icon={FileIcon} />}
            title={label}
            meta={meta}
          />
          <div className="border-t border-gray-6 p-3">
            <Skeleton className="h-40 w-full" />
          </div>
        </ChatCard>
      );
    }

    const previewElement = selectTextPreview({
      kind,
      content,
      label,
      fileName: previewUtils.baseFileName(file.fileName),
    });
    if (previewElement) return previewElement;
  }

  return <FileCard file={file} label={label} meta={meta} />;
}

function FileCard({
  file,
  label,
  meta,
}: {
  file: FileProducedEvent;
  label: string;
  meta: string;
}) {
  return (
    <ChatCard className="my-3 max-w-md">
      <ChatCardHeader
        tile={<ChatCardTile kind="file" icon={FileIcon} />}
        title={label}
        meta={meta}
        trailing={
          <PreviewIconButton
            icon={Download}
            label={t('Download')}
            href={file.url}
            size="icon-xs"
          />
        }
      />
    </ChatCard>
  );
}

function selectTextPreview({
  kind,
  content,
  label,
  fileName,
}: {
  kind: FileKind;
  content: string;
  label: string;
  fileName: string;
}) {
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

function fileMeta(file: FileProducedEvent): string {
  const type =
    previewUtils.readableFileType({
      mediaType: file.mediaType,
      fileName: file.fileName,
    }) ?? t('File');
  const size = formatBytes(file.byteSize);
  return size ? `${type} · ${size}` : type;
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

const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;
