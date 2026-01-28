import { cn } from '@/lib/utils';
import {
  UserConversationMessage,
  UserFileConversationMessage,
  UserImageConversationMessage,
  UserTextConversationMessage,
} from '@activepieces/shared';
import { FilePreview } from '../../file-preview';
import { ImagePreview } from '../../image-preview';

interface UserMessageProps {
  className?: string;
  message: UserConversationMessage;
}

const TextContent = ({ content }: { content: UserTextConversationMessage }) => {
  return <span>{content.message}</span>;
};

export function UserMessage({ className, message }: UserMessageProps) {
  const textContent = message.content.filter(
    (c): c is UserTextConversationMessage => c.type === 'text',
  );
  const fileContent = message.content.filter(
    (c): c is UserFileConversationMessage => c.type === 'file',
  );
  const imageContent = message.content.filter(
    (c): c is UserImageConversationMessage => c.type === 'image',
  );

  const hasAttachments = fileContent.length > 0 || imageContent.length > 0;

  return (
    <div className="flex flex-col items-end gap-2 ml-auto max-w-[70%]">
      {textContent.length > 0 && (
        <div className={cn('text-base', className)}>
          {textContent.map((content, index) => (
            <TextContent key={`text-${index}`} content={content} />
          ))}
        </div>
      )}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 justify-end">
          {fileContent.map((content, index) => (
            <FilePreview key={`file-${index}`} content={content} />
          ))}
          {imageContent.map((content, index) => (
            <ImagePreview key={`image-${index}`} content={content} />
          ))}
        </div>
      )}
    </div>
  );
}
