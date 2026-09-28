import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { EventDestinationFormat } from '@activepieces/shared';
import { t } from 'i18next';
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

import type { DestinationFormValues } from '../lib/destination-form-utils';

import { EncryptedHeadersNotice, HeadersField } from './connection-fields';
import { TestEventCard } from './test-event-card';

export const OpenTelemetryConnection = ({
  form,
  isEdit,
}: {
  form: UseFormReturn<DestinationFormValues>;
  isEdit: boolean;
}) => {
  const url = useWatch({ control: form.control, name: 'url' });

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequiredIndicator>{t('Endpoint URL')}</FormLabel>
            <FormControl>
              <Input
                className="font-mono"
                placeholder="https://otlp.datadoghq.com/v1/logs"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t("Paste your tool's full OTLP logs URL.")}
            </FormDescription>
            {!isLogsEndpoint(url) && (
              <p className="text-xs text-warning">
                {t(
                  'This URL does not end in /logs. An OTLP receiver expects the full logs URL.',
                )}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <HeadersField form={form} isEdit={isEdit} keyPlaceholder="DD-API-KEY" />

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
                  field.onChange(encoding);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  id="otlp-protobuf"
                  value={EventDestinationFormat.OTLP_PROTOBUF}
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
