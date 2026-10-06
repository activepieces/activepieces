import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { EventDestinationFormat } from '@activepieces/shared';
import { t } from 'i18next';
import { RefObject } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import {
  destinationFormUtils,
  DestinationFormValues,
} from '../lib/destination-form-utils';

import { EncryptedHeadersNotice, HeadersField } from './connection-fields';
import { TestEventCard } from './test-event-card';

export const OpenTelemetryConnection = ({
  form,
  storedHeaderNames,
  isFormatAutoSwitched,
}: {
  form: UseFormReturn<DestinationFormValues>;
  storedHeaderNames: string[];
  isFormatAutoSwitched: RefObject<boolean>;
}) => {
  const url = useWatch({ control: form.control, name: 'url' });
  const isWebhookUrl = destinationFormUtils.isWebhookUrl(url);

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="url"
        rules={{ deps: ['headers'] }}
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequiredIndicator>{t('Endpoint URL')}</FormLabel>
            <FormControl>
              <Input
                className="font-mono"
                placeholder="https://otlp.datadoghq.com/v1/logs"
                {...field}
                onChange={(event) => {
                  field.onChange(event);
                  const currentFormat = form.getValues('format');
                  const next = destinationFormUtils.resolveOtlpFormat({
                    url: event.target.value,
                    format: currentFormat,
                    isAutoSwitched: isFormatAutoSwitched.current,
                  });
                  isFormatAutoSwitched.current = next.isAutoSwitched;
                  if (next.format !== currentFormat) {
                    form.setValue('format', next.format, {
                      shouldDirty: true,
                    });
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              {t("Paste your tool's full OTLP logs URL.")}
            </FormDescription>
            {isWebhookUrl && (
              <p className="text-xs text-warning-11">
                {t(
                  'This URL is a flow webhook, which accepts only JSON, so Protobuf is off. A generated handler flow reads Raw JSON: to use one, send to a webhook instead.',
                )}
              </p>
            )}
            {!isWebhookUrl && !isLogsEndpoint(url) && (
              <p className="text-xs text-warning-11">
                {t(
                  'This URL does not end in /logs. An OTLP receiver expects the full logs URL.',
                )}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <HeadersField
        form={form}
        storedHeaderNames={storedHeaderNames}
        keyPlaceholder="DD-API-KEY"
      />

      <FormField
        control={form.control}
        name="format"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-0.5">
              <FormLabel>{t('Encoding')}</FormLabel>
              <FormDescription>
                {t("Check your tool's docs if you're not sure.")}
              </FormDescription>
            </div>
            <RadioGroup
              className="flex gap-6"
              value={field.value}
              onValueChange={(value) => {
                const encoding = OTLP_FORMATS.find(
                  (candidate) => candidate === value,
                );
                if (!isNil(encoding)) {
                  isFormatAutoSwitched.current = false;
                  field.onChange(encoding);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  id="otlp-protobuf"
                  value={EventDestinationFormat.OTLP_PROTOBUF}
                  disabled={isWebhookUrl}
                />
                <Label htmlFor="otlp-protobuf" className="font-normal">
                  {t('Protobuf')}
                </Label>
                <Badge className="rounded-md">{t('Recommended')}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  id="otlp-json"
                  value={EventDestinationFormat.OTLP_JSON}
                />
                <Label htmlFor="otlp-json" className="font-normal">
                  {t('JSON')}
                </Label>
              </div>
            </RadioGroup>
          </FormItem>
        )}
      />

      <EncryptedHeadersNotice />

      <TestEventCard
        form={form}
        description={t(
          'Sends one of your selected events to the endpoint above. Shown as JSON; Protobuf sends the same content as binary.',
        )}
        storedHeaderNames={storedHeaderNames}
      />
    </div>
  );
};

function isLogsEndpoint(url: string): boolean {
  const { data: parsed } = tryCatchSync(() => new URL(url));
  return isNil(parsed) || parsed.pathname.replace(/\/+$/, '').endsWith('/logs');
}

const OTLP_FORMATS = [
  EventDestinationFormat.OTLP_PROTOBUF,
  EventDestinationFormat.OTLP_JSON,
];
