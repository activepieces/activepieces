import { isNil } from '@activepieces/core-utils';
import { DestinationType } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ExternalLink, RotateCcw } from 'lucide-react';
import { UseFormReturn, useFormState, useWatch } from 'react-hook-form';

import { JsonEditor } from '@/components/custom/json-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { destinationFormUtils } from '../lib/destination-form-utils';
import type { DestinationFormValues } from '../lib/destination-form-utils';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { buildEventLabels } from '../lib/event-labels';

const SUCCESS_STATUS_CEILING = 300;

export const MappingStep = ({
  form,
  mapperKey,
  onMapperReplaced,
}: {
  form: UseFormReturn<DestinationFormValues>;
  mapperKey: number;
  onMapperReplaced: (mapper: unknown) => void;
}) => {
  const eventLabels = buildEventLabels();
  const { data: presets } = eventDestinationsCollectionUtils.usePresets();
  const type = useWatch({ control: form.control, name: 'type' });
  const url = useWatch({ control: form.control, name: 'url' });
  const events = useWatch({ control: form.control, name: 'events' });
  const headers = useWatch({ control: form.control, name: 'headers' });
  const mapper = useWatch({ control: form.control, name: 'mapper' });

  const preset = (presets ?? []).find((candidate) => candidate.type === type);
  const {
    mutate: sendTestEvent,
    data: testResult,
    isPending: isTesting,
  } = eventDestinationsCollectionUtils.useTestEventDestination();

  const { errors } = useFormState({ control: form.control, name: 'url' });
  const hasUnreadableHeader = destinationFormUtils.hasBlankHeaderValue(headers);
  const isTestDisabled =
    isTesting || url === '' || !isNil(errors.url) || hasUnreadableHeader;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="mapper"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between gap-2">
              <FormLabel>{t('Payload template')}</FormLabel>
              <div className="flex items-center gap-2">
                {!isNil(preset?.docsUrl) && (
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={preset.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {preset.label}
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                )}
                {!isNil(preset) && type !== DestinationType.CUSTOM && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onMapperReplaced(preset.defaultMapper)}
                  >
                    <RotateCcw className="size-3.5" />
                    {t('Reset to preset')}
                  </Button>
                )}
              </div>
            </div>
            <JsonEditor
              key={mapperKey}
              field={field}
              readonly={false}
              className="text-xs"
            />
            <FormDescription>
              {t(
                'Leave this empty to send the raw audit event. Variables and functions use the same syntax as flows.',
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTestDisabled || events.length === 0}
              loading={isTesting}
            >
              {t('Send test event')}
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {events.map((event) => (
              <DropdownMenuItem
                key={event}
                onSelect={() =>
                  sendTestEvent({
                    url,
                    event,
                    headers: destinationFormUtils.toTestHeaders(headers),
                    mapper: destinationFormUtils.toMapper(mapper),
                  })
                }
              >
                {eventLabels[event]?.label ?? event}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {!isNil(testResult) && (
          <div className="flex items-center gap-2">
            {!isNil(testResult.status) && (
              <Badge
                variant={
                  testResult.status < SUCCESS_STATUS_CEILING
                    ? 'success'
                    : 'destructive'
                }
              >
                {testResult.status}
              </Badge>
            )}
            {!isNil(testResult.error) && (
              <Badge variant="destructive">{t('Failed')}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {t('{duration} ms', { duration: testResult.durationMs })}
            </span>
          </div>
        )}

        {hasUnreadableHeader && (
          <span className="text-xs text-muted-foreground">
            {t(
              'Retype your header values to send a test. Saved values are never sent back.',
            )}
          </span>
        )}
      </div>

      {!isNil(testResult) && (
        <div className="flex flex-col gap-2">
          {!isNil(testResult.error) && (
            <p className="text-xs text-destructive">{testResult.error}</p>
          )}
          <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
            {JSON.stringify(testResult.renderedBody, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
