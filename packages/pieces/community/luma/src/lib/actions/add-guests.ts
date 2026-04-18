import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../auth';
import { lumaCommon } from '../common';

export const addGuestsAction = createAction({
  auth: lumaAuth,
  name: 'add-guests',
  displayName: 'Add Guests',
  description: 'Register guests for a Luma event',
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The event ID (starts with evt-)',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Guest Emails',
      description: 'Email addresses of guests to add',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const guests = (propsValue.emails as string[]).map((email) => ({
      email,
    }));

    return lumaCommon.makeRequest({
      apiKey: auth,
      method: HttpMethod.POST,
      path: '/event/add-guests',
      body: {
        event_id: propsValue.event_id,
        guests,
      },
    });
  },
});
