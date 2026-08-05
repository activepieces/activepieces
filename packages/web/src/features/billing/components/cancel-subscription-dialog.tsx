import {
  CANCELLATION_COMMENT_MAX_LENGTH,
  CancellationReason,
  CancelSubscriptionRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  title,
  confirmText,
  warning,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <CancelSubscriptionForm
          key={open ? 'open' : 'closed'}
          title={title}
          confirmText={confirmText}
          warning={warning}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function CancelSubscriptionForm({
  title,
  confirmText,
  warning,
  onConfirm,
  onOpenChange,
}: CancelSubscriptionFormProps) {
  const form = useForm<CancellationFeedbackFormValues>({
    resolver: zodResolver(CancellationFeedbackFormSchema),
    mode: 'onChange',
    defaultValues: { reasons: [], comment: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: CancellationFeedbackFormValues) =>
      onConfirm(toRequest(values)),
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutate(values))}
        className="flex flex-col gap-4"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('Could you tell us why you are canceling?')}
          </DialogDescription>
        </DialogHeader>

        <FormField
          control={form.control}
          name="reasons"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              {REASON_OPTIONS.map((option, index) => {
                const checked = field.value.includes(option.reason);
                return (
                  <button
                    key={option.reason}
                    type="button"
                    aria-pressed={checked}
                    onClick={() =>
                      field.onChange(
                        checked
                          ? field.value.filter(
                              (reason) => reason !== option.reason,
                            )
                          : [...field.value, option.reason],
                      )
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent',
                      checked && 'border-primary bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground',
                        checked && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {String.fromCharCode(LETTER_A_CHAR_CODE + index)}
                    </span>
                    <span>{t(option.label)}</span>
                  </button>
                );
              })}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <Label htmlFor="cancellation-comment">
                {t('Anything else you want us to know?')}
              </Label>
              <FormControl>
                <Textarea
                  {...field}
                  id="cancellation-comment"
                  rows={3}
                  maxLength={CANCELLATION_COMMENT_MAX_LENGTH}
                  placeholder={t('We read every answer...')}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Alert variant="warning">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('Keep my plan')}
          </Button>
          <Button type="submit" variant="destructive" loading={isPending}>
            {confirmText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function toRequest(
  values: CancellationFeedbackFormValues,
): CancelSubscriptionRequest {
  const comment = values.comment.trim();
  return {
    reasons: values.reasons,
    ...(comment === '' ? {} : { comment }),
  };
}

const LETTER_A_CHAR_CODE = 65;

const REASON_OPTIONS = [
  {
    reason: CancellationReason.SWITCHING_TO_ANOTHER_TOOL,
    label: 'Switching to another automation tool',
  },
  {
    reason: CancellationReason.MISSING_INTEGRATIONS,
    label: 'Missing integrations I need',
  },
  {
    reason: CancellationReason.NO_NEED_RIGHT_NOW,
    label: "Don't need automation right now",
  },
  {
    reason: CancellationReason.FREE_PLAN_IS_ENOUGH,
    label: 'Free plan covers what I need',
  },
  {
    reason: CancellationReason.BUGS_OR_TECHNICAL_ISSUES,
    label: 'Bugs or technical issues',
  },
  {
    reason: CancellationReason.TOO_EXPENSIVE,
    label: 'Too expensive for our team',
  },
];

const CancellationFeedbackFormSchema = z.object({
  reasons: z.array(z.enum(CancellationReason)),
  comment: z.string(),
});

type CancellationFeedbackFormValues = z.infer<
  typeof CancellationFeedbackFormSchema
>;

type CancelSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmText: string;
  warning: React.ReactNode | string;
  onConfirm: (request: CancelSubscriptionRequest) => Promise<void>;
};

type CancelSubscriptionFormProps = Omit<
  CancelSubscriptionDialogProps,
  'open'
> & {
  onOpenChange: (open: boolean) => void;
};
