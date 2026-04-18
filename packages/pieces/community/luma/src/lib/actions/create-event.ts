import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../auth';
import { lumaCommon } from '../common';

export const createEventAction = createAction({
  auth: lumaAuth,
  name: 'create-event',
  displayName: 'Create Event',
  description: 'Create a new event on Luma',
  props: {
    name: Property.ShortText({
      displayName: 'Event Name',
      required: true,
    }),
    start_at: Property.DateTime({
      displayName: 'Start Date & Time',
      required: true,
    }),
    end_at: Property.DateTime({
      displayName: 'End Date & Time',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone, e.g. America/New_York',
      required: true,
    }),
    description_md: Property.LongText({
      displayName: 'Description',
      description: 'Event description in markdown',
      required: false,
    }),
    meeting_url: Property.ShortText({
      displayName: 'Meeting URL',
      description: 'Online meeting link (Zoom, Google Meet, etc.)',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Unlisted', value: 'unlisted' },
        ],
      },
    }),
    max_capacity: Property.Number({
      displayName: 'Max Capacity',
      description: 'Maximum number of guests. Leave empty for unlimited.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      name: propsValue.name,
      start_at: new Date(propsValue.start_at).toISOString(),
      timezone: propsValue.timezone,
    };

    if (propsValue.end_at) body.end_at = new Date(propsValue.end_at).toISOString();
    if (propsValue.description_md) body.description_md = propsValue.description_md;
    if (propsValue.meeting_url) body.meeting_url = propsValue.meeting_url;
    if (propsValue.visibility) body.visibility = propsValue.visibility;
    if (propsValue.max_capacity) body.max_capacity = propsValue.max_capacity;

    return lumaCommon.makeRequest({
      apiKey: auth,
      method: HttpMethod.POST,
      path: '/event/create',
      body,
    });
  },
});
