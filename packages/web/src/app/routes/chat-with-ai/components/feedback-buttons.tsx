import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { MessageAction } from '@/components/prompt-kit/message';
import { chatApi } from '@/features/chat/lib/chat-api';
import { cn } from '@/lib/utils';

import { FeedbackDialog } from './feedback-dialog';

type Rating = 'up' | 'down';

const BUTTON_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const ACTIVE_CLASS = 'text-foreground/80 hover:text-foreground/80';

export function FeedbackButtons({
  conversationId,
  messageIndex,
  initialRating,
}: {
  conversationId: string;
  messageIndex: number;
  initialRating?: Rating;
}) {
  const [rating, setRating] = useState<Rating | undefined>(initialRating);
  const [dialogOpen, setDialogOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (next: Rating | null) =>
      chatApi.submitMessageFeedback({
        conversationId,
        messageIndex,
        rating: next,
      }),
  });

  const submit = (clicked: Rating) => {
    const previous = rating;
    const next = rating === clicked ? null : clicked;
    setRating(next ?? undefined);
    mutation.mutate(next, { onError: () => setRating(previous) });
    if (clicked === 'down' && next === 'down') {
      setDialogOpen(true);
    }
  };

  const renderButton = (
    value: Rating,
    label: string,
    Icon: typeof ThumbsUp,
  ) => {
    const active = rating === value;
    return (
      <MessageAction tooltip={label}>
        <motion.button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={() => submit(value)}
          whileTap={{ scale: 0.8 }}
          className={cn(BUTTON_CLASS, active && ACTIVE_CLASS)}
        >
          <motion.span
            initial={false}
            animate={active ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Icon className={cn('h-3.5 w-3.5', active && 'fill-current')} />
          </motion.span>
        </motion.button>
      </MessageAction>
    );
  };

  return (
    <>
      {rating !== 'down' && renderButton('up', t('Good response'), ThumbsUp)}
      {rating !== 'up' && renderButton('down', t('Bad response'), ThumbsDown)}
      <FeedbackDialog
        key={dialogOpen ? 'open' : 'closed'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conversationId={conversationId}
        messageIndex={messageIndex}
      />
    </>
  );
}
