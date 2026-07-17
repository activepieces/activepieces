import { ChatFeedbackReason } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { chatApi } from '@/features/chat/lib/chat-api';
import { cn } from '@/lib/utils';

const REASON_LABELS: Record<ChatFeedbackReason, string> = {
  incorrect_or_incomplete: 'Incorrect or incomplete',
  not_what_i_asked_for: 'Not what I asked for',
  slow_or_buggy: 'Slow or buggy',
  style_or_tone: 'Style or tone',
  safety_or_security: 'Safety or security concern',
  other: 'Other',
};

export function FeedbackDialog({
  open,
  onOpenChange,
  conversationId,
  messageIndex,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  messageIndex: number;
}) {
  const [reasons, setReasons] = useState<Set<ChatFeedbackReason>>(new Set());
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      chatApi.submitMessageFeedback({
        conversationId,
        messageIndex,
        rating: 'down',
        reasons: [...reasons],
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => onOpenChange(false),
  });

  const toggleReason = (reason: ChatFeedbackReason) => {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) {
        next.delete(reason);
      } else {
        next.add(reason);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Share feedback')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {ChatFeedbackReason.options.map((reason) => {
            const selected = reasons.has(reason);
            return (
              <Button
                key={reason}
                type="button"
                size="sm"
                variant={selected ? 'secondary' : 'outline'}
                aria-pressed={selected}
                onClick={() => toggleReason(reason)}
                className={cn('rounded-full', selected && 'border-foreground')}
              >
                {t(REASON_LABELS[reason])}
              </Button>
            );
          })}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('Share details (optional)')}
          maxLength={2000}
          className="min-h-[96px] resize-y"
        />
        <DialogFooter className="items-center gap-2 sm:justify-between">
          {mutation.isError ? (
            <span className="text-sm text-destructive">
              {t("Couldn't submit feedback. Please try again.")}
            </span>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {t('Submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
