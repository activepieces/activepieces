import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { eventTypeOutputSchema } from '../output-schemas';

export const createOneOffEventTypeAction = createAction({
  auth: calendlyAuth,
  name: 'create_one_off_event_type',
  classification: 'WRITE',
  displayName: 'Create One-Off Meeting Link',
  description: 'Creates a one-off meeting and returns its booking link.',
  audience: 'both',
  aiMetadata: {
    description:
      "Create a Calendly one-off meeting: a temporary event type bookable only between Start Date and End Date, outside the host's regular event types. Returns the one-off event type with its scheduling_url to send to the invitee. Not idempotent: each call creates another one-off meeting.",
    idempotent: false,
  },
  outputSchema: eventTypeOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'First bookable date, YYYY-MM-DD.',
      required: true,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Last bookable date, YYYY-MM-DD.',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: "IANA timezone such as America/New_York. Defaults to the host's timezone.",
      required: false,
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description: 'User URI or UUID of the host. Leave empty for the connected user.',
      required: false,
    }),
    locationKind: Property.StaticDropdown({
      displayName: 'Location',
      required: false,
      options: {
        options: [
          { label: 'Google Meet', value: 'google_conference' },
          { label: 'Zoom', value: 'zoom_conference' },
          { label: 'Microsoft Teams', value: 'microsoft_teams_conference' },
          { label: 'Webex', value: 'webex_conference' },
          { label: 'GoToMeeting', value: 'gotomeeting_conference' },
          { label: 'In person', value: 'physical' },
          { label: 'Phone call (invitee calls host)', value: 'inbound_call' },
          { label: 'Phone call (host calls invitee)', value: 'outbound_call' },
          { label: 'Custom', value: 'custom' },
          { label: 'Ask invitee', value: 'ask_invitee' },
        ],
      },
    }),
    location: Property.ShortText({
      displayName: 'Location Details',
      description: 'Address for in person, text for custom, or the phone number for inbound calls.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const host = await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: propsValue.host });
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/one_off_event_types',
      body: {
        name: propsValue.name,
        host,
        duration: propsValue.duration,
        ...(calendlyCommon.isProvided(propsValue.timezone) ? { timezone: propsValue.timezone.trim() } : {}),
        date_setting: {
          type: 'date_range',
          start_date: propsValue.startDate.trim(),
          end_date: propsValue.endDate.trim(),
        },
        ...(calendlyCommon.isProvided(propsValue.locationKind)
          ? { location: toLocation({ kind: propsValue.locationKind, details: propsValue.location }) }
          : {}),
      },
    });
    return response.resource;
  },
});

function toLocation({ kind, details }: { kind: string; details: string | undefined }): Record<string, string> {
  const value = details?.trim();
  if (!value) {
    return { kind };
  }
  return kind === 'inbound_call' ? { kind, phone_number: value } : { kind, location: value };
}
