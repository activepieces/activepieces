import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth, getPinchPaymentsToken } from '../common/auth';

export const findEventAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'find_event',
  displayName: 'Find Event',
  description: 'Find an event using the Event ID',
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      description: 'The Event ID in evt_XXXXXXXXXXXXXX format',
      required: true,
    }),
  },
  async run(context) {
    const { eventId } = context.propsValue;

    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const tokenResponse = await getPinchPaymentsToken(credentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.getpinch.com.au/test/events/${eventId}`,
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
