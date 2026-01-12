import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ApplicationEventName,
  OutgoingWebhook,
  CreatePlatformOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared';

import { outgoingWebhooksCollectionUtils } from '../lib/outgoing-webhooks-collection';
import { toast } from 'sonner';

interface OutgoingWebhookDialogProps {
  children: React.ReactNode;
  webhook: OutgoingWebhook | null;
}

export const OutgoingWebhookDialog = ({
  children,
  webhook,
}: OutgoingWebhookDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreatePlatformOutgoingWebhookRequestBody>({
    defaultValues: {
      url: webhook?.url || '',
      events: webhook?.events || [],
    },
  });

  const { mutate: testWebhook, isPending: isTesting } =
    outgoingWebhooksCollectionUtils.useTestOutgoingWebhook();
  
  const { mutate: createWebhook, isPending: isCreating } =
    outgoingWebhooksCollectionUtils.useCreateOutgoingWebhook(
      () => {
        toast.success(t('Success'), {
          description: t('Outgoing webhook created successfully'),
        });
        setIsOpen(false);
        form.reset();
      },
      (error: Error) => {
        toast.error(t('Error'), {
          description: error.message,
        });
      },
    );

  const handleSubmit = (data: CreatePlatformOutgoingWebhookRequestBody) => {
    // Basic validation
    if (!data.url || data.url.trim() === '') {
      toast.error(t('Error'), {
        description: t('Please enter a valid URL'),
      });
      return;
    }

    if (!data.events || data.events.length === 0) {
      toast.error(t('Error'), {
        description: t('Please select at least one event'),
      });
      return;
    }

    if (webhook) {
      // Update existing webhook
      try {
        outgoingWebhooksCollectionUtils.update(webhook.id, data);
        toast.success(t('Success'), {
          description: t('Outgoing webhook updated successfully'),
        });
        setIsOpen(false);
        form.reset();
      } catch (error) {
        toast.error(t('Error'), {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      // Create new webhook
      createWebhook(data);
    }
  };

  const availableEvents = Object.values(ApplicationEventName);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {webhook ? t('Update Outgoing Webhook') : t('Create Outgoing Webhook')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Webhook URL')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="events"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">{t('Events')}</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {availableEvents.map((event) => (
                      <FormField
                        key={event}
                        control={form.control}
                        name="events"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={event}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, event])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== event,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <Label className="text-sm font-normal">
                                {event.replace(/_/g, ' ')}
                              </Label>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isCreating}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => testWebhook({ url: form.getValues('url') })}
                disabled={form.getValues('url') === '' || isTesting}
              >
                {isTesting ? t('Testing...') : t('Test Webhook')}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating
                  ? t('...')
                  : webhook
                  ? t('Update Webhook')
                  : t('Create Webhook')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
