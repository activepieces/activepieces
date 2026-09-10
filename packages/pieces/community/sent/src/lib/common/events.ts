import { Property } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi, SentApiError } from './api';
import { EventType, EventTypes, Subscription } from './types';
import { sentValues } from './values';

function options({
  events,
  parent,
}: {
  events: EventType[];
  parent?: string;
}): { label: string; value: string }[] {
  return events
    .filter((event) => event.is_active)
    .flatMap((event) => {
      const canonical = event.name.includes('.')
        ? event.name
        : parent
        ? `${parent}.${event.name}`
        : event.event_type || event.name;
      return [
        { label: event.display_name || canonical, value: canonical },
        ...options({
          events: event.sub_types ?? [],
          parent: canonical.split('.')[0],
        }),
      ];
    });
}

function subscription(selected: string[]): Subscription {
  if (!selected.length) throw new Error('Select at least one webhook event.');
  const parents = [...new Set(selected.map((event) => event.split('.')[0]))];
  if (
    parents.some((parent) => !parent) ||
    selected.some((event) => event.endsWith('.'))
  )
    throw new Error('Invalid webhook event selection.');
  const filters = Object.fromEntries(
    parents
      .filter((parent) => !selected.includes(parent))
      .map((parent) => [
        parent,
        [
          ...new Set(
            selected
              .filter((event) => event.startsWith(`${parent}.`))
              .map((event) => event.slice(parent.length + 1))
          ),
        ],
      ])
  );
  return {
    event_types: parents,
    ...(Object.keys(filters).length ? { event_filters: filters } : {}),
  };
}

function matches({
  body,
  selected,
}: {
  body: unknown;
  selected: string[];
}): boolean {
  if (
    !sentValues.isRecord(body) ||
    !sentValues.isRecord(body['payload']) ||
    typeof body['timestamp'] !== 'string'
  )
    return false;
  return selected.some((event) =>
    event.includes('.')
      ? body['event'] === event && body['field'] === event.split('.')[0]
      : body['field'] === event
  );
}

const selector = Property.MultiSelectDropdown({
  auth: sentAuth,
  displayName: 'Events',
  description:
    'Select specific events or a parent event for every subtype. Options are loaded from Sent.',
  required: true,
  defaultValue: ['message.received'],
  refreshers: ['profile_id'],
  options: async ({ auth, profile_id }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Sent account first',
      };
    try {
      const result = sentApi.data(
        await sentApi.request<EventTypes>({
          apiKey: auth.secret_text,
          path: '/webhooks/event-types',
          profileId: sentValues.optionalString(profile_id),
        })
      );
      const choices = options({ events: result.event_types });
      return {
        options: choices.filter(
          (choice, index) =>
            choices.findIndex((other) => other.value === choice.value) === index
        ),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder:
          error instanceof SentApiError
            ? error.message
            : 'Could not load Sent events. Check the connection.',
      };
    }
  },
});

export const sentEvents = { options, subscription, matches, selector };
