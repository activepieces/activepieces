import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
  propertyGroups: [
    {
      key: 'meeting',
      display: 'section',
      label: 'Event',
      icon: 'type',
      props: ['name', 'duration', 'host'],
    },
    {
      key: 'window',
      display: 'section',
      label: 'Booking Window',
      icon: 'calendar',
      props: ['bookingInfo', 'startDate', 'endDate', 'timezone'],
    },
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['locationKind', 'location'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Shown to invitees. Up to 55 characters.',
      placeholder: 'Intro Call',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Length in minutes, up to 720.',
      required: true,
    }),
    bookingInfo: Property.MarkDown({
      value: 'Invitees can book from Start Date through End Date.',
      variant: MarkdownVariant.INFO,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      placeholder: 'YYYY-MM-DD',
      width: 'half',
      required: true,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      placeholder: 'YYYY-MM-DD',
      width: 'half',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: "Empty: the host's timezone.",
      placeholder: 'America/New_York',
      required: false,
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description: 'User URI or ID. Empty: the connected user.',
      placeholder: 'https://api.calendly.com/users/…',
      required: false,
    }),
    locationKind: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Google Meet', value: 'google_conference' },
          { label: 'Zoom', value: 'zoom_conference' },
          { label: 'Microsoft Teams', value: 'microsoft_teams_conference' },
          { label: 'Webex', value: 'webex_conference' },
          { label: 'GoToMeeting', value: 'gotomeeting_conference' },
          { label: 'In Person', value: 'physical' },
          { label: 'Invitee Calls Host', value: 'inbound_call' },
          { label: 'Host Calls Invitee', value: 'outbound_call' },
          { label: 'Custom', value: 'custom' },
          { label: 'Ask Invitee', value: 'ask_invitee' },
        ],
      },
    }),
    location: Property.ShortText({
      displayName: 'Details',
      description: 'In Person: address. Invitee Calls Host: phone number. Custom: text.',
      placeholder: '123 Main St, Springfield',
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
