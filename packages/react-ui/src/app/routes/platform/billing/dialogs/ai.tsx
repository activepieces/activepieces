import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type AiLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (limit: number) => void;
  initialLimit?: number;
};

const AiLimitSchema = Type.Object({
  credits: Type.Number({ minimum: 0 }),
});

type AiLimitSchema = Static<typeof AiLimitSchema>;

export const AiLimitDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialLimit = 0,
}: AiLimitDialogProps) => {
  const form = useForm<AiLimitSchema>({
    resolver: typeboxResolver(AiLimitSchema),
    defaultValues: { credits: initialLimit },
  });

  useEffect(() => {
    form.reset({ credits: initialLimit });
  }, [initialLimit]);

  const updateLimits: SubmitHandler<AiLimitSchema> = (data) => {
    onSubmit(data.credits);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('AI Credits Usage Limit ')}</DialogTitle>
          <DialogDescription>
            {t(
              'Specify a monthly limit for AI Credits to avoid excessive usage. AI steps will no fail if this limit was reached.',
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(updateLimits)}
            className="grid space-y-4 my-4"
          >
            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <div className="relative">
                    <Input
                      {...field}
                      required
                      id="credits"
                      type="number"
                      placeholder={t('Monthly AI Credits Limit')}
                      className="rounded-sm w-full pr-8"
                      min={0}
                      onChange={(e) => field.onChange(+e.target.value)}
                    />
                    {!(
                      form.watch('credits').toString() === '' ||
                      form.watch('credits') <= 0
                    ) && (
                      <Button
                        type="button"
                        variant="transparent"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
                        onClick={() => field.onChange('')}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-end">
              <DialogClose asChild>
                <Button className="text-[0.75rem]" variant="outline">
                  {t('Cancel')}
                </Button>
              </DialogClose>
              <Button
                className="w-24 text-[0.75rem]"
                type="submit"
                disabled={
                  !form.formState.isDirty ||
                  form.watch('credits').toString() === '' ||
                  form.watch('credits') <= 0
                }
              >
                {t('Save changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
