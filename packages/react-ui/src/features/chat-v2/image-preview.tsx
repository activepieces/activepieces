import { UserImageConversationMessage } from '@activepieces/shared';
import { ImageIcon } from 'lucide-react';

type ImagePreviewProps = {
  content: UserImageConversationMessage;
};

export const ImagePreview = ({ content }: ImagePreviewProps) => {
  return (
    <a
      href={content.image}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-1.5 max-w-[200px] hover:bg-muted transition-colors"
    >
      <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate text-foreground">
        {content.name || 'Image'}
      </span>
    </a>
  );
};
