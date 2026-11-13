import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatEvents } from '../common/events';

export const createEventAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_event',
  classification: 'WRITE',
  displayName: 'Create Event',
  description: 'Creates a community event and invites members, groups or outside guests.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a community event with a start time, duration in minutes and location (a new Heartbeat voice channel, Zoom if the community has the Zoom integration, or custom text), inviting members or guests by email and groups by ID. Emails that are not members get an external invite. Always pass invitees: with none, Heartbeat limited the event to the Administrator group in testing (the API docs say it is open to everyone). Invitees are notified. Not idempotent: each call creates another event.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    startTime: Property.DateTime({ displayName: 'Start Time', description: 'ISO 8601, for example 2026-10-13T15:00:00Z.', required: true }),
    durationMinutes: Property.Number({ displayName: 'Duration (Minutes)', required: true }),
    location: Property.StaticDropdown({
      displayName: 'Location',
      description: 'Heartbeat creates a voice channel for the event. Zoom needs the Zoom integration connected in your Heartbeat settings.',
      required: true,
      defaultValue: 'HEARTBEAT',
      options: {
        disabled: false,
        options: [
          { label: 'Heartbeat voice channel', value: 'HEARTBEAT' },
          { label: 'Zoom', value: 'ZOOM' },
          { label: 'Custom (enter below)', value: 'CUSTOM' },
        ],
      },
    }),
    customLocation: Property.ShortText({ displayName: 'Custom Location', description: 'Used when Location is Custom, for example an address or a meeting link.', required: false }),
    invitedEmails: heartbeatProps.emails({ displayName: 'Invited Emails', description: 'Members are invited in Heartbeat; other emails get an external invitation.', required: false }),
    invitedGroupIds: heartbeatProps.ids({ displayName: 'Invited Group IDs', description: 'Use List Groups to find IDs. Add invitees: with none, Heartbeat may limit the event to admins.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.createdEvent,
  async run({ auth, propsValue }) {
    const startTime = heartbeatApi.isoDate({ value: propsValue.startTime, label: 'Start Time' });
    if (startTime === undefined) {
      throw new Error('Start Time is required.');
    }
    const duration = Number(propsValue.durationMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_DURATION_MINUTES) {
      throw new Error(`Duration must be a whole number of minutes between 1 and ${MAX_DURATION_MINUTES}.`);
    }
    const location = resolveLocation({ location: propsValue.location, customLocation: propsValue.customLocation });
    const created = await heartbeatApi.request<unknown>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/events',
      operation: 'create event',
      body: {
        name: heartbeatApi.requiredText({ value: propsValue.name, label: 'Name' }),
        description: heartbeatApi.optionalText(propsValue.description) ?? '',
        startTime,
        duration,
        location,
        invitedUsers: heartbeatApi.listOrUndefined(heartbeatApi.emailList({ value: propsValue.invitedEmails, label: 'Invited Emails' })),
        invitedGroups: heartbeatApi.listOrUndefined(heartbeatApi.uuidList({ value: propsValue.invitedGroupIds, label: 'Invited Group IDs' })),
      },
    });
    const vendorEvent = heartbeatApi.isRecord(created) && heartbeatApi.isRecord(created['event']) ? created['event'] : {};
    const eventId = vendorEvent['id'];
    if (typeof eventId !== 'string') {
      throw new Error('Heartbeat created the event but did not return its ID. Use List Events to find it.');
    }
    const lookup = await heartbeatApi.afterWrite({
      what: 'the new event',
      load: () => heartbeatEvents.getEvent({ token: auth.secret_text, eventId }),
    });
    return { ...(lookup.value ?? vendorEvent), location: vendorEvent['location'] ?? null, lookupError: lookup.lookupError };
  },
});

function resolveLocation({ location, customLocation }: { location: unknown; customLocation: unknown }): string {
  if (location === 'HEARTBEAT' || location === 'ZOOM') {
    return location;
  }
  if (location === 'CUSTOM') {
    const text = heartbeatApi.optionalText(customLocation)?.trim();
    if (text === undefined) {
      throw new Error('Custom Location is required when Location is Custom.');
    }
    return text;
  }
  throw new Error('Location must be HEARTBEAT, ZOOM or CUSTOM.');
}

const MAX_DURATION_MINUTES = 10_080;
