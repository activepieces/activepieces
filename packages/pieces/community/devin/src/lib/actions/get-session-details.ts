import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { devinAuth } from '../..';

export const getSessionDetails = createAction({
  name: 'get_session_details',
  displayName: 'Get Session Details',
  description: 'Retrieves details of a specific Devin session',
  auth: devinAuth,
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      required: true,
      description: 'The ID of the session to retrieve details for',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.devin.ai/v1/session/${propsValue.sessionId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
