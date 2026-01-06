import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';

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

    const tokenResponse = await import('../common/auth').then(auth => 
      auth.getPinchPaymentsToken(credentials)
    );

    const response = await import('@activepieces/pieces-common').then(({ httpClient, HttpMethod }) =>
      httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.getpinch.com.au/test/events/${eventId}`,
        headers: {
          'Authorization': `Bearer ${tokenResponse.access_token}`,
          'Content-Type': 'application/json',
        },
      })
    );

    return response.body;
  },
});
