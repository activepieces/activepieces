import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  ApplicationEventName,
  OutgoingWebhook,
  OutgoingWebhookScope,
} from '@activepieces/ee-shared';
import { ApErrorParams, ErrorCode, Project } from '@activepieces/shared';

import { outgoingWebhooksHooks } from '../lib/outgoing-webhooks-hooks';
import { api } from '@/lib/api';

const formSchema = z.object({
  url: z.string().url({ message: t('Please enter a valid URL') }),
  scope: z.nativeEnum(OutgoingWebhookScope),
  events: z.array(z.nativeEnum(ApplicationEventName)).min(1, {
    message: t('Please select at least one event'),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface OutgoingWebhookDialogProps {
  children: React.ReactNode;
  webhook: OutgoingWebhook | null;
}

export const OutgoingWebhookDialog = ({
  children,
  webhook,
}: OutgoingWebhookDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: webhook?.url || '',
      scope: webhook?.scope || OutgoingWebhookScope.PLATFORM,
      events: webhook?.events || [],
    },
  });

  const { mutate: testWebhook, isPending: isTesting } =
    outgoingWebhooksHooks.useTestOutgoingWebhook();
  const { mutate: mutateWebhook, isPending } =
    outgoingWebhooksHooks.useMutateOutgoingWebhook();

  const handleSubmit = (data: FormData) => {
    mutateWebhook(
      { id: webhook?.id || '', data },
      {
        onSuccess: () => {
          toast({
            title: t('Success'),
            description: t(
              `Outgoing webhook ${
                webhook ? 'updated' : 'created'
              } successfully`,
            ),
            duration: 3000,
          });
          setIsOpen(false);
          form.reset();
        },
        onError: (error: Error) => {
          let message = error.message;
          if (api.isError(error)) {
            const apError = error.response?.data as ApErrorParams;
            if (apError.code === ErrorCode.VALIDATION) {
              message = apError.params.message;
            }
          }
          toast({
            title: t('Error'),
            description: message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const availableEvents = Object.values(ApplicationEventName);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Create Outgoing Webhook')}</DialogTitle>
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
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Scope')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select scope')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={OutgoingWebhookScope.PLATFORM}>
                        {t('Platform')}
                      </SelectItem>
                      <SelectItem value={OutgoingWebhookScope.PROJECT}>
                        {t('Project')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={isPending}
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
              <Button type="submit" disabled={isPending}>
                {isPending
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
