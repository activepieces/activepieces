import { ApplicationEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import type { DestinationFormValues } from '../lib/destination-form-utils';
import { buildEventGroups } from '../lib/event-groups';
import { buildEventLabels } from '../lib/event-labels';

export const EventsStep = ({
  form,
}: {
  form: UseFormReturn<DestinationFormValues>;
}) => {
  const eventLabels = buildEventLabels();
  const eventGroups = buildEventGroups();
  const checkboxIdPrefix = useId();
  const [search, setSearch] = useState('');
  const [activeGroupKey, setActiveGroupKey] = useState(
    eventGroups[0]?.key ?? '',
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

  const activeGroup =
    visibleGroups.find((group) => group.key === activeGroupKey) ??
    visibleGroups[0];

  const allEvents = eventGroups.flatMap((group) => group.events);

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
        const isEverythingSelected = allEvents.every((event) =>
          field.value.includes(event),
        );
        const selectedInActiveGroup =
          activeGroup?.events.filter((event) => field.value.includes(event)) ??
          [];
        const groupCheckboxId = `${checkboxIdPrefix}-group`;

        return (
          <FormItem className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t('Search events')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  isEverythingSelected
                    ? field.onChange([])
                    : toggleEvents({ events: allEvents, shouldSelect: true })
                }
              >
                {isEverythingSelected ? t('Clear') : t('Select all')}
              </Button>
            </div>

            <div className="grid min-h-[340px] grid-cols-[240px_minmax(0,1fr)] overflow-hidden rounded-lg border">
              <nav className="flex flex-col gap-0.5 border-r bg-accent p-1.5">
                {visibleGroups.map((group) => {
                  const isActive = group.key === activeGroup?.key;
                  const selectedCount = group.events.filter((event) =>
                    field.value.includes(event),
                  ).length;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setActiveGroupKey(group.key)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'flex h-[34px] items-center gap-2.5 rounded-md px-2.5 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-background font-semibold'
                          : 'hover:bg-background/60',
                      )}
                    >
                      <span className="flex-1 truncate">{group.title}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {t('{selected}/{total}', {
                          selected: selectedCount,
                          total: group.events.length,
                        })}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-1 px-[18px] py-3.5">
                {activeGroup === undefined ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t('No events match your search')}
                  </p>
                ) : (
                  <>
                    <div className="mb-1 flex h-8 items-center gap-2.5 border-b pb-2">
                      <Checkbox
                        id={groupCheckboxId}
                        checked={
                          selectedInActiveGroup.length === 0
                            ? false
                            : selectedInActiveGroup.length ===
                              activeGroup.events.length
                            ? true
                            : 'indeterminate'
                        }
                        onCheckedChange={(checked) =>
                          toggleEvents({
                            events: activeGroup.events,
                            shouldSelect: checked === true,
                          })
                        }
                      />
                      <Label
                        htmlFor={groupCheckboxId}
                        className="flex-1 cursor-pointer text-sm font-medium"
                      >
                        {activeGroup.title}
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {t('{selected} of {total} selected', {
                          selected: selectedInActiveGroup.length,
                          total: activeGroup.events.length,
                        })}
                      </span>
                    </div>
                    {activeGroup.events.map((event) => {
                      const checkboxId = `${checkboxIdPrefix}-${event}`;
                      return (
                        <div
                          key={event}
                          className="flex h-9 items-center gap-2.5"
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
                            className="flex-1 cursor-pointer text-sm font-normal"
                          >
                            {eventLabels[event]?.label ?? event}
                          </Label>
                          <span className="font-mono text-xs text-muted-foreground">
                            {event}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
