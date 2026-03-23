import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { pinchPaymentsClient } from '../common/client';

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
      environment: context.auth.props.environment
    };
    
    return pinchPaymentsClient(credentials, HttpMethod.GET, `/events/${eventId}`);
  },
});
