import { File01Icon, Video01Icon } from '@hugeicons/core-free-icons';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';

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
      className="p-2 w-80 rounded-lg border px-2 max-w-full hover:bg-gray-3 transition-colors cursor-pointer"
      href={content}
      download={fileName ?? 'file'}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
          <div className="h-full w-full flex items-center justify-center bg-gray-12 text-gray-1">
            {isVideo ? (
              <HugeiconsIcon icon={Video01Icon} className="h-5 w-5" />
            ) : (
              <HugeiconsIcon icon={File01Icon} className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="overflow-hidden flex flex-col gap-1">
          <div className="truncate font-semibold text-sm leading-none">
            {fileName ?? (role === 'user' ? 'Untitled File' : 'Download File')}
          </div>
          {fileName && (
            <div className="truncate text-sm text-gray-11 leading-none">
              {role === 'user' ? 'View File' : 'Download File'}
            </div>
          )}
        </div>
      </div>
    </a>
  );
};
