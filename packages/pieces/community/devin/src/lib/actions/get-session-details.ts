import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { devinAuth } from '../..';

export const getSessionDetails = createAction({
  name: 'get_session_details',
  displayName: 'Get Session Details',
  description: 'Retrieves details of a specific Devin session',
  audience: 'both',
  aiMetadata: { description: 'Fetches the current details and status of an existing Devin session by its session id. Use this to check progress, read results, or poll the outcome of a previously created session. Read-only and idempotent; requires a valid session id.', idempotent: true },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
