import { FileIcon, VideoIcon } from 'lucide-react';
import React from 'react';

interface FileMessageProps {
  content: string;
  mimeType?: string;
  fileName?: string;
  role?: 'user' | 'bot';
}

export const FileMessage: React.FC<FileMessageProps> = ({
  content,
  mimeType,
  fileName,
  role,
}) => {
  const isVideo = mimeType?.startsWith('video/');
  return (
    <a
      className="p-2 w-80 rounded-lg border px-2 max-w-full hover:bg-muted transition-colors cursor-pointer"
      href={content}
      download={fileName ?? 'file'}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
          <div className="h-full w-full flex items-center justify-center bg-foreground text-background">
            {isVideo ? (
              <VideoIcon className="h-5 w-5" />
            ) : (
              <FileIcon className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="overflow-hidden flex flex-col gap-1">
          <div className="truncate font-semibold text-sm leading-none">
            {fileName ?? (role === 'user' ? 'Untitled File' : 'Download File')}
          </div>
          {fileName && (
            <div className="truncate text-sm text-token-text-tertiary leading-none">
              {role === 'user' ? 'View File' : 'Download File'}
            </div>
          )}
        </div>
      </div>
    </a>
  );
};
