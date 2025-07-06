import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { sessionIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';

export const terminateSession = createAction({
  auth: airtopAuth,
  name: 'terminateSession',
  displayName: 'Terminate Session',
  description: 'Ends an existing browser session.',
  props: {
    sessionId: sessionIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { sessionId } = propsValue;
    const apiKey = auth as string;

    const response = await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/sessions/${sessionId}`,
      undefined,
      undefined
    );

    return {
      message: `Session terminated successfully`,
      response,
    };
  },
});
