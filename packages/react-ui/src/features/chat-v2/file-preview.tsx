import { UserFileConversationMessage } from '@activepieces/shared';
import { FileIcon } from 'lucide-react';

type FilePreviewProps = {
  content: UserFileConversationMessage;
};

export const FilePreview = ({ content }: FilePreviewProps) => {
  return (
    <a
      href={content.file}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-1.5 max-w-[200px] hover:bg-muted transition-colors"
    >
      <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate text-foreground">
        {content.name || 'File'}
      </span>
    </a>
  );
};
