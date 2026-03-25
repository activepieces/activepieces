import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

export const lumaCreateEvent = createAction({
  auth: lumaAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Create a new event on your Luma Calendar',
  props: {
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event',
      required: true,
    }),
    start_at: Property.ShortText({
      displayName: 'Start At',
      description:
        'The start date and time of the event in ISO 8601 format (e.g. 2024-01-01T10:00:00Z)',
      required: true,
    }),
    end_at: Property.ShortText({
      displayName: 'End At',
      description:
        'The end date and time of the event in ISO 8601 format (e.g. 2024-01-01T12:00:00Z)',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'The timezone for the event (e.g. America/New_York)',
      required: false,
    }),
    require_rsvp_approval: Property.Checkbox({
      displayName: 'Require RSVP Approval',
      description: 'Whether guests need approval to attend',
      required: false,
      defaultValue: false,
    }),
    meeting_url: Property.ShortText({
      displayName: 'Meeting URL',
      description: 'The virtual meeting link for the event',
      required: false,
    }),
    geo_address_json: Property.Object({
      displayName: 'Location',
      description: 'The location object for the event',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
      start_at: context.propsValue.start_at,
      end_at: context.propsValue.end_at,
    };

    if (context.propsValue.timezone) {
      body['timezone'] = context.propsValue.timezone;
    }
    if (context.propsValue.require_rsvp_approval !== undefined) {
      body['require_rsvp_approval'] =
        context.propsValue.require_rsvp_approval;
    }
    if (context.propsValue.meeting_url) {
      body['meeting_url'] = context.propsValue.meeting_url;
    }
    if (context.propsValue.geo_address_json) {
      body['geo_address_json'] = context.propsValue.geo_address_json;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://public-api.luma.com/v1/event/create',
      headers: {
        'x-luma-api-key': context.auth.secret_text,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
