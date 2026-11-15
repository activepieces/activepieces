import { RefObject } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';

import type { DestinationFormValues } from '../lib/destination-form-utils';
import { destinationKinds } from '../lib/destination-kinds';

import { OpenTelemetryConnection } from './open-telemetry-connection';
import { WebhookConnection } from './webhook-connection';

export const ConnectionStep = ({
  form,
  isEdit,
  storedHeaderNames,
  isFormatAutoSwitched,
}: {
  form: UseFormReturn<DestinationFormValues>;
  isEdit: boolean;
  storedHeaderNames: string[];
  isFormatAutoSwitched: RefObject<boolean>;
}) => {
  const format = useWatch({ control: form.control, name: 'format' });

  return destinationKinds.kindOf(format) === 'otel' ? (
    <OpenTelemetryConnection
      form={form}
      storedHeaderNames={storedHeaderNames}
      isFormatAutoSwitched={isFormatAutoSwitched}
    />
  ) : (
    <WebhookConnection
      form={form}
      isEdit={isEdit}
      storedHeaderNames={storedHeaderNames}
    />
  );
};
