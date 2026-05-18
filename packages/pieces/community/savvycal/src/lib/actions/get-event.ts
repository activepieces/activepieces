import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, flattenEvent, SavvyCalEvent } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const getEventAction = createAction({
  auth: savvyCalAuth,
  name: 'get_event',
  displayName: 'Get Event',
  description: 'Retrieves the details of a specific scheduled meeting by its ID.',
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The unique ID of the event. You can find this in the event URL in SavvyCal, or from the output of a trigger or List Events action.',
      required: true,
    }),
  },
  async run(context) {
    const response = await savvyCalApiCall<SavvyCalEvent>({
      token: getToken(context.auth),
      method: HttpMethod.GET,
      path: `/events/${context.propsValue.event_id}`,
    });

    return flattenEvent(response.body);
  },
});
