import { tryCatchSync } from '@activepieces/core-utils';
import { EventDestination, EventDestinationFormat } from '@activepieces/shared';
import { t } from 'i18next';

import { ParsedDestination } from './parse-flow-id-from-url';

function title({
  destination,
  parsed,
  flowDisplayName,
}: {
  destination: EventDestination;
  parsed: ParsedDestination;
  flowDisplayName: string | undefined;
}): string {
  if (parsed.kind === 'flow') {
    return (
      flowDisplayName ??
      t('Destination (flow {flowId})', { flowId: parsed.flowId })
    );
  }
  const { data: url } = tryCatchSync(() => new URL(destination.url));
  return url?.host ?? destination.url;
}

function formatLabel({
  format,
  parsed,
}: {
  format: EventDestinationFormat;
  parsed: ParsedDestination;
}): string {
  switch (format) {
    case EventDestinationFormat.OTLP_PROTOBUF:
      return t('OpenTelemetry · Protobuf');
    case EventDestinationFormat.OTLP_JSON:
      return t('OpenTelemetry · JSON');
    case EventDestinationFormat.RAW:
      return parsed.kind === 'flow'
        ? t('Handler flow · Raw JSON')
        : t('Webhook · Raw JSON');
  }
}

export const destinationSummary = {
  title,
  formatLabel,
};
