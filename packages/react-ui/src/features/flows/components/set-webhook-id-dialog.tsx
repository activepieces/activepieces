import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Flow, PopulatedFlow } from '@activepieces/shared';

const SetWebhookIdSchema = Type.Object({
  externalId: Type.String({
    minLength: 1,
    pattern: '^[a-zA-Z0-9_-]+$',
  }),
});

type SetWebhookIdSchema = Static<typeof SetWebhookIdSchema>;

type SetWebhookIdDialogProps = {
  children: React.ReactNode;
  flow: PopulatedFlow;
  onUpdate: () => void;
};

const SetWebhookIdDialog: React.FC<SetWebhookIdDialogProps> = ({
  children,
  flow,
  onUpdate,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm<SetWebhookIdSchema>({
    resolver: typeboxResolver(SetWebhookIdSchema),
    defaultValues: {
      externalId: flow.externalId || '',
    },
  });

  const { mutate, isPending } = useMutation<
    Flow,
    Error,
    {
      flowId: string;
      externalId: string;
    }
  >({
    mutationFn: async ({ flowId, externalId }) => {
      return api.patch<Flow>(`/v1/flows/${flowId}`, { externalId });
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      onUpdate();
      toast({
        title: t('Success'),
        description: t('Webhook ID has been set.'),
        duration: 3000,
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update webhook ID';
      toast({
        title: t('Error'),
        description: message,
        duration: 5000,
      });
    },
  });

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (open) {
          form.reset({ externalId: flow.externalId || '' });
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Set Webhook ID')}</DialogTitle>
          <DialogDescription>
            {t(
              'Set a stable identifier for webhook URLs. This allows the same webhook URL to work across different environments (DEV, QA, PRODUCTION).',
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit((data) =>
              mutate({
                flowId: flow.id,
                externalId: data.externalId,
              }),
            )}
          >
            <FormField
              control={form.control}
              name="externalId"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="externalId">{t('Webhook ID')}</Label>
                  <Input
                    {...field}
                    id="externalId"
                    placeholder={t('my-flow-webhook-id')}
                    className="rounded-sm font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'Use lowercase letters, numbers, hyphens, and underscores only. Example: my-payment-webhook',
                    )}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button loading={isPending}>{t('Save')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { SetWebhookIdDialog };


