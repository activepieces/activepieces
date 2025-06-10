import { ArrowUp } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { userHooks } from '@/hooks/user-hooks';
import { UserAvatar } from '@/components/ui/user-avatar';

type TodoTextareaProps = {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
};

export const TodoTextarea = ({
  onSubmit,
  placeholder = "You can use markdown to format your comment",
  disabled = false,
  title
}: TodoTextareaProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: currentUser } = userHooks.useCurrentUser();

  const handleSubmit = async () => {
    if (!content.trim() || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {currentUser && (
            <UserAvatar 
              size={32}
              email={currentUser?.email} 
              name={currentUser?.firstName + ' ' + currentUser?.lastName} 
            />
          )}
        </div>
        <div className="flex-1">
          {title && (
            <div className="flex items-center gap-2 h-8 font-bold">
              {title}
            </div>
          )}
          <div className="relative mt-1">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] pr-12"
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full border 
                            enabled:hover:text-white
                            enabled:bg-primary enabled:hover:bg-primary/90 enabled:text-white"
              size="icon"
              variant="ghost"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 