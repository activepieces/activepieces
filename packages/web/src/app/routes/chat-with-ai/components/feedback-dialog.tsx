import { AgentFeedbackReason } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const [reasons, setReasons] = useState<Set<AgentFeedbackReason>>(new Set());
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
    onSuccess: () => {
      onOpenChange(false);
      toast.success(t('Thanks for your feedback'));
    },
  });

  const toggleReason = (reason: AgentFeedbackReason) => {
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
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('What went wrong?')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {AgentFeedbackReason.options.map((reason) => {
            const selected = reasons.has(reason);
            return (
              <Button
                key={reason}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={selected}
                onClick={() => toggleReason(reason)}
                className={cn(
                  'font-normal',
                  selected &&
                    'border-accent-7 bg-accent-3 text-accent-11 hover:bg-accent-3 hover:text-accent-11',
                )}
              >
                {reasonLabel(reason)}
              </Button>
            );
          })}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('Tell us more (optional)')}
          maxLength={2000}
          className="min-h-24 resize-y"
        />
        <DialogFooter className="items-center gap-2">
          {mutation.isError && (
            <span className="mr-auto text-sm text-danger-11">
              {t("Couldn't submit feedback. Please try again.")}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            {t('Send feedback')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function reasonLabel(reason: AgentFeedbackReason): string {
  switch (reason) {
    case 'incorrect_or_incomplete':
      return t('Incorrect or incomplete');
    case 'not_what_i_asked_for':
      return t('Not what I asked for');
    case 'slow_or_buggy':
      return t('Slow or buggy');
    case 'style_or_tone':
      return t('Style or tone');
    case 'safety_or_security':
      return t('Safety or security concern');
    case 'other':
      return t('Other');
  }
}
