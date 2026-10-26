import { EventDestinationFormat } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, LucideIcon, Workflow } from 'lucide-react';

function buildOptions(): DestinationKindOption[] {
  return [
    {
      kind: 'otel',
      icon: Activity,
      title: t('Send to an OpenTelemetry tool'),
      shortTitle: t('OpenTelemetry tool'),
      description: t(
        'Datadog, Grafana, Honeycomb, New Relic, or any OTLP backend. Sent as OTLP log records.',
      ),
      formatLabel: t('Format · OTLP'),
    },
    {
      kind: 'webhook',
      icon: Workflow,
      title: t('Send to a webhook'),
      shortTitle: t('Webhook'),
      description: t(
        'Any endpoint that accepts JSON. Paste your own URL, or generate a handler flow to route events to Slack, Gmail, or any app.',
      ),
      formatLabel: t('Format · Raw JSON'),
    },
  ];
}

function kindOf(format: EventDestinationFormat): DestinationKind {
  return format === EventDestinationFormat.RAW ? 'webhook' : 'otel';
}

function defaultFormatOf(kind: DestinationKind): EventDestinationFormat {
  return kind === 'webhook'
    ? EventDestinationFormat.RAW
    : EventDestinationFormat.OTLP_PROTOBUF;
}

function parse(value: string | null): DestinationKind | null {
  return DESTINATION_KINDS.find((kind) => kind === value) ?? null;
}

export const destinationKinds = {
  buildOptions,
  kindOf,
  defaultFormatOf,
  parse,
};

const DESTINATION_KINDS: DestinationKind[] = ['otel', 'webhook'];

export const DESTINATION_KIND_SEARCH_PARAM = 'destination';

export type DestinationKind = 'otel' | 'webhook';

export type DestinationKindOption = {
  kind: DestinationKind;
  icon: LucideIcon;
  title: string;
  shortTitle: string;
  description: string;
  formatLabel: string;
};
