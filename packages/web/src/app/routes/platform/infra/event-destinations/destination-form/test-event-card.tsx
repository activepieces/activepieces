import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  ApplicationEventName,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn, useFormState, useWatch } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { destinationErrors } from '../lib/destination-errors';
import { destinationFormUtils } from '../lib/destination-form-utils';
import type { DestinationFormValues } from '../lib/destination-form-utils';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { buildEventLabels } from '../lib/event-labels';

export const TestEventCard = ({
  form,
  description,
  storedHeaderNames,
}: {
  form: UseFormReturn<DestinationFormValues>;
  description: string;
  storedHeaderNames: string[];
}) => {
  const eventLabels = buildEventLabels();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const url = useWatch({ control: form.control, name: 'url' });
  const events = useWatch({ control: form.control, name: 'events' });
  const headers = useWatch({ control: form.control, name: 'headers' });
  const format = useWatch({ control: form.control, name: 'format' });
  const { errors } = useFormState({ control: form.control, name: 'url' });
  const [chosenEvent, setChosenEvent] = useState<ApplicationEventName | null>(
    null,
  );

  const {
    mutate: sendTestEvent,
    data: testResult,
    error: testError,
    variables: sentRequest,
    isPending: isTesting,
  } = eventDestinationsCollectionUtils.useTestEventDestination();

  const activeEvent =
    !isNil(chosenEvent) && events.includes(chosenEvent)
      ? chosenEvent
      : events[0];
  const currentRequest = isNil(activeEvent)
    ? null
    : destinationFormUtils.toTestRequest({
        url,
        event: activeEvent,
        headers,
        format,
      });
  const isCurrent =
    !isNil(sentRequest) &&
    !isNil(currentRequest) &&
    destinationFormUtils.isSameTestRequest({
      sent: sentRequest,
      current: currentRequest,
    });
  const headerBlocker = destinationFormUtils.findTestHeaderBlocker({
    headers,
    storedHeaderNames,
  });
  const isSendDisabled =
    isTesting ||
    isNil(currentRequest) ||
    url === '' ||
    !isNil(errors.url) ||
    !isNil(headerBlocker);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{t('Send test event')}</span>
        <span className="text-sm text-gray-11">{description}</span>
      </div>
      <div className="flex gap-2">
        <Select
          value={activeEvent ?? ''}
          onValueChange={(value) =>
            setChosenEvent(events.find((event) => event === value) ?? null)
          }
          disabled={events.length === 0}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t('Choose an event')} />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event} value={event}>
                {eventLabels[event]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          {...adminControl(AdminControl.EVENT_DESTINATIONS_WEBHOOK_TEST_RUN)}
          type="button"
          variant="outline"
          disabled={isSendDisabled}
          loading={isTesting}
          onClick={() => {
            if (isNil(currentRequest)) {
              return;
            }
            sendTestEvent(currentRequest);
          }}
        >
          <Send className="size-4" />
          {t('Send test event')}
        </Button>
      </div>

      {!isNil(headerBlocker) && (
        <p className="text-xs text-gray-11">
          {headerBlocker === 'blankValue'
            ? t(
                'Retype your header values to send a test. Saved values are never sent back.',
              )
            : t('Fix the header errors above to send a test.')}
        </p>
      )}

      {isCurrent && !isNil(testError) && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <Badge className="self-start rounded-md" variant="destructive">
            {t('Failed')}
          </Badge>
          <p className="text-xs text-danger-11">
            {destinationErrors.describe(testError)}
          </p>
        </div>
      )}

      {isCurrent && !isNil(testResult) && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <div className="flex items-center gap-2.5">
            {!isNil(testResult.status) && (
              <Badge
                className="rounded-md"
                variant={
                  testResult.status < SUCCESS_STATUS_CEILING
                    ? 'success'
                    : 'destructive'
                }
              >
                <span className="size-1.5 rounded-full bg-current" />
                {testResult.status}
              </Badge>
            )}
            {!isNil(testResult.errorCode) && (
              <Badge className="rounded-md" variant="destructive">
                {t('Failed')}
              </Badge>
            )}
            <span className="text-sm text-gray-11">
              {t('{duration} ms', { duration: testResult.durationMs })}
            </span>
          </div>
          {!isNil(testResult.errorCode) && (
            <p className="text-xs text-danger-11">
              {destinationErrors.describeTestError({
                code: testResult.errorCode,
                isCloud: edition === ApEdition.CLOUD,
              })}
            </p>
          )}
          <span className="text-xs font-medium text-gray-11">
            {t('Body sent')}
          </span>
          <pre className="max-h-40 overflow-auto rounded-md border bg-gray-2 px-4 py-3 font-mono text-xs leading-relaxed text-gray-11">
            {JSON.stringify(testResult.renderedBody, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const SUCCESS_STATUS_CEILING = 300;
