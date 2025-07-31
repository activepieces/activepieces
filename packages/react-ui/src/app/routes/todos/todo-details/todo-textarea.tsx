import { ArrowRight } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

type TodoTextareaProps = {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
};

export const TodoTextarea = ({
  onSubmit,
  placeholder = 'You can use markdown to format your comment',
  disabled = false,
  title,
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
            <div className="flex items-center gap-2 h-8 font-bold">{title}</div>
          )}
          <div className="relative mt-1">
            <div className="h-[155px] w-full p-[1px] rounded-lg border border-input-border">
              <div
                className={cn(
                  'relative rounded-md bg-background w-full h-full flex flex-col justify-between',
                )}
              >
                <ScrollArea className="w-full flex-grow overflow-auto">
                  <div className="p-2 pb-0">
                    <Textarea
                      className="w-full bg-background border-none resize-none overflow-hidden"
                      placeholder={placeholder}
                      minRows={2}
                      maxRows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isSubmitting}
                    />
                  </div>
                </ScrollArea>
                <div className="flex justify-end mx-2 mb-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!content.trim()}
                    aria-label="Submit"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
