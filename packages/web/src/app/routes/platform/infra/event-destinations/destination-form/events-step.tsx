import { ApFlagId, ApplicationEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import type { DestinationFormValues } from '../lib/destination-form-utils';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { buildEventGroups } from '../lib/event-groups';
import { buildEventLabels } from '../lib/event-labels';
import { handlerFlowBuilder } from '../lib/handler-flow-builder';

export const EventsStep = ({
  form,
}: {
  form: UseFormReturn<DestinationFormValues>;
}) => {
  const eventLabels = buildEventLabels();
  const eventGroups = buildEventGroups();
  const checkboxIdPrefix = useId();
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<string[]>([
    eventGroups[0]?.key ?? '',
  ]);
  const selectedEvents = useWatch({ control: form.control, name: 'events' });
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );

  const matchesSearch = (event: ApplicationEventName) => {
    const needle = search.trim().toLowerCase();
    if (needle === '') {
      return true;
    }
    const label = eventLabels[event]?.label ?? event;
    return (
      label.toLowerCase().includes(needle) ||
      event.toLowerCase().includes(needle)
    );
  };

  const visibleGroups = eventGroups
    .map((group) => ({
      ...group,
      events: group.events.filter(matchesSearch),
    }))
    .filter((group) => group.events.length > 0);

  const allEvents = eventGroups.flatMap((group) => group.events);

  const { mutate: importHandlerFlow, isPending: isImporting } =
    eventDestinationsCollectionUtils.useImportHandlerFlow(
      (createdFlow) => {
        form.setValue('url', `${webhookPrefixUrl}/${createdFlow.id}`, {
          shouldValidate: true,
        });
        toast.success(t('Success'), {
          description: t(
            'The Webhook URL now points to the new handler flow. Publish the flow before you save.',
          ),
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
    if (selectedEvents.length === 0) {
      form.setError('events', { message: t('Select at least one event') });
      return;
    }
    if (!webhookPrefixUrl) {
      toast.error(t('Webhook URL prefix is not configured.'));
      return;
    }
    importHandlerFlow({
      template: handlerFlowBuilder.buildHandlerFlowTemplate({
        events: selectedEvents.map((name) => ({
          name,
          label: eventLabels[name]?.label ?? name,
        })),
        labels: handlerFlowLabels({ selectedEvents, eventLabels }),
      }),
      selectedEvents,
    });
  };

  return (
    <FormField
      control={form.control}
      name="events"
      render={({ field }) => {
        const toggleEvents = ({
          events,
          shouldSelect,
        }: {
          events: ApplicationEventName[];
          shouldSelect: boolean;
        }) => {
          const remaining = field.value.filter(
            (value) => !events.includes(value),
          );
          field.onChange(shouldSelect ? [...remaining, ...events] : remaining);
        };

        return (
          <FormItem className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={t('Search events')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  toggleEvents({ events: allEvents, shouldSelect: true })
                }
              >
                {t('Select all')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange([])}
              >
                {t('Clear')}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {visibleGroups.map((group) => {
                const selectedInGroup = group.events.filter((event) =>
                  field.value.includes(event),
                );
                const isOpen = openGroups.includes(group.key);
                return (
                  <Collapsible
                    key={group.key}
                    open={isOpen}
                    onOpenChange={(open) =>
                      setOpenGroups(
                        open
                          ? [...openGroups, group.key]
                          : openGroups.filter((key) => key !== group.key),
                      )
                    }
                    className="rounded-md border"
                  >
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Checkbox
                        checked={
                          selectedInGroup.length === 0
                            ? false
                            : selectedInGroup.length === group.events.length
                            ? true
                            : 'indeterminate'
                        }
                        onCheckedChange={(checked) =>
                          toggleEvents({
                            events: group.events,
                            shouldSelect: checked === true,
                          })
                        }
                      />
                      <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 text-left">
                        <span className="text-sm font-medium">
                          {group.title}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {t('{selected} of {total} selected', {
                            selected: selectedInGroup.length,
                            total: group.events.length,
                          })}
                          <ChevronDown
                            className={cn(
                              'size-4 transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </span>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-2 border-t px-3 py-3">
                        {group.events.map((event) => {
                          const checkboxId = `${checkboxIdPrefix}-${event}`;
                          return (
                            <div
                              key={event}
                              className="flex items-center gap-3"
                            >
                              <Checkbox
                                id={checkboxId}
                                checked={field.value.includes(event)}
                                onCheckedChange={(checked) =>
                                  toggleEvents({
                                    events: [event],
                                    shouldSelect: checked === true,
                                  })
                                }
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
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {t('{selected} of {total} events selected', {
                  selected: field.value.length,
                  total: allEvents.length,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImportHandlerFlow}
                disabled={isImporting}
                loading={isImporting}
              >
                <Sparkles className="size-4" />
                {t('Generate handler flow')}
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

function handlerFlowLabels({
  selectedEvents,
  eventLabels,
}: {
  selectedEvents: ApplicationEventName[];
  eventLabels: ReturnType<typeof buildEventLabels>;
}) {
  return {
    flowDisplayName: t('Event handler starter'),
    flowDescription: t(
      'Routes audit events into branches you can wire to Slack, Gmail, Teams, or any HTTP endpoint.',
    ),
    webhookTriggerDisplayName: t('Catch Webhook'),
    eventTypeRouterDisplayName: t('Event type checker'),
    runStatusRouterDisplayName: t('Run status check'),
    failedRunBranchName: t('Failed run'),
    otherwiseBranchName: t('Otherwise'),
    noteContent: t(
      '**Audit event handler**\n\nThis flow runs whenever any of these events fire:\n\n{events}\n\n**Add your channel** (Slack, Gmail, Teams, HTTP…) inside each branch below.\n\nOnce you are done:\n\n1. **Publish this flow** so it can receive events.\n2. Head back to the **Event Streaming** tab and create the destination to start sending events here.',
      {
        events: selectedEvents
          .map((name) => `- ${eventLabels[name]?.label ?? name}`)
          .join('\n'),
      },
    ),
    sampleDataNoteContent: t(
      '**Test different scenarios**\n\nOpen the trigger and edit its **Sample Data** to swap in a different event payload and test each branch without firing real audit events.',
    ),
  };
}
