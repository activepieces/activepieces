import {
  ApFlagId,
  ApplicationEventName,
  EventDestination,
  CreatePlatformEventDestinationRequestBody,
  isNil,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { handlerFlowBuilder } from '../lib/handler-flow-builder';
import { useEventLabels } from '../lib/use-event-labels';

interface EventDestinationDialogProps {
  children: React.ReactNode;
  destination: EventDestination | null;
}

export const EventDestinationDialog = ({
  children,
  destination,
}: EventDestinationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl gap-2">
        <EventDestinationForm
          key={isOpen ? 'open' : 'closed'}
          destination={destination}
          onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

type EventDestinationFormProps = {
  destination: EventDestination | null;
  onClose: () => void;
};

const EventDestinationForm = ({
  destination,
  onClose,
}: EventDestinationFormProps) => {
  const eventLabels = useEventLabels();
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const checkboxIdPrefix = useId();

  const formSchema = z.object({
    url: z.url(t('Invalid URL')).min(1, t('Webhook URL is required')),
    events: z
      .array(z.enum(ApplicationEventName))
      .min(1, t('Select at least one event')),
  });

  const form = useForm<CreatePlatformEventDestinationRequestBody>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      url: destination?.url ?? '',
      events: destination?.events ?? [],
    },
  });

  const watchedUrl = form.watch('url');
  const watchedEvents = form.watch('events') ?? [];

  const { mutate: testDestination, isPending: isTesting } =
    eventDestinationsCollectionUtils.useTestEventDestination();

  const { mutate: createDestination, isPending: isCreating } =
    eventDestinationsCollectionUtils.useCreateEventDestination(
      () => {
        toast.success(t('Success'), {
          description: t('Destination created successfully'),
        });
        onClose();
      },
      (error: Error) => {
        toast.error(t('Error'), {
          description: error.message,
        });
      },
    );

  const handleSubmit = (data: CreatePlatformEventDestinationRequestBody) => {
    if (destination) {
      try {
        eventDestinationsCollectionUtils.update(destination.id, data);
        toast.success(t('Success'), {
          description: t('Destination updated successfully'),
        });
        onClose();
      } catch (error) {
        toast.error(t('Error'), {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      createDestination(data);
    }
  };

  const { mutate: importHandlerFlow, isPending: isImporting } =
    eventDestinationsCollectionUtils.useImportHandlerFlow(
      (createdFlow) => {
        form.setValue('url', `${webhookPrefixUrl}/${createdFlow.id}`, {
          shouldValidate: true,
        });
        window.open(
          `/flows/${createdFlow.id}`,
          '_blank',
          'noopener,noreferrer',
        );
      },
      (error) => {
        toast.error(
          error.message ||
            t('Failed to generate the handler flow. Please try again.'),
        );
      },
    );

  const handleImportHandlerFlow = () => {
    const selectedEvents = form.getValues('events') ?? [];
    if (selectedEvents.length === 0) {
      form.setError('events', {
        message: t('Select at least one event'),
      });
      return;
    }
    if (!webhookPrefixUrl) {
      toast.error(t('Webhook URL prefix is not configured.'));
      return;
    }
    const template = handlerFlowBuilder.buildHandlerFlowTemplate({
      events: selectedEvents.map((name) => ({
        name,
        label: eventLabels[name].label,
      })),
      labels: {
        flowDisplayName: t('Event handler starter'),
        flowDescription: t(
          'Routes audit events into branches you can wire to Slack, Gmail, Teams, or any HTTP endpoint.',
        ),
        webhookTriggerDisplayName: t('Catch Webhook'),
        eventTypeRouterDisplayName: t('Event type checker'),
        runStatusRouterDisplayName: t('Run status check'),
        failedRunBranchName: t('Failed run'),
        otherwiseBranchName: t('Otherwise'),
      },
    });
    importHandlerFlow({ template, selectedEvents });
  };

  const availableEvents = Object.values(ApplicationEventName);
  const isSubmitDisabled = isCreating || isImporting;

  const isTestingButtonDisabled =
    isTesting ||
    !watchedUrl ||
    !isNil(form.formState.errors.url) ||
    watchedEvents.length === 0;

  return (
    <>
      <DialogTitle>
        {destination ? t('Edit Destination') : t('New Destination')}
      </DialogTitle>
      <DialogDescription>
        {destination
          ? t('Update the webhook endpoint and event subscriptions.')
          : t(
              'Send audit events to a webhook. Use an internal flow to route them to your notification channels — Slack, Gmail, Microsoft Teams, or any other channel.',
            )}
      </DialogDescription>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="events"
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequiredIndicator className="text-base">
                  {t('Events')}
                </FormLabel>
                <ScrollArea
                  className="h-48 rounded-md "
                  viewPortClassName="px-0"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {availableEvents.map((event) => {
                      const checkboxId = `${checkboxIdPrefix}-${event}`;
                      const isChecked = field.value?.includes(event) ?? false;
                      return (
                        <div
                          key={event}
                          className="flex flex-row items-center gap-3"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, event]
                                  : current.filter((value) => value !== event),
                              );
                            }}
                          />
                          <Label
                            htmlFor={checkboxId}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {eventLabels[event]?.label ?? event}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel showRequiredIndicator>{t('Webhook URL')}</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/webhook" {...field} />
                </FormControl>
                {!destination && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t(
                          'Or generate an internal flow to handle the selected events:',
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImportHandlerFlow}
                        disabled={isImporting || isCreating}
                        loading={isImporting}
                      >
                        <Sparkles className="size-4" />
                        {t('Generate handler flow')}
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t(
                        "Don't forget to publish your flow before creating the alert.",
                      )}
                    </span>
                  </div>
                )}
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitDisabled}
            >
              {t('Cancel')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isTestingButtonDisabled}
                >
                  {isTesting ? t('Testing...') : t('Test webhook')}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {watchedEvents.map((event) => (
                  <DropdownMenuItem
                    key={event}
                    onSelect={() =>
                      testDestination({
                        url: watchedUrl,
                        event,
                      })
                    }
                  >
                    {eventLabels[event]?.label ?? event}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              loading={isCreating}
            >
              {destination ? t('Save changes') : t('Create alert')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
