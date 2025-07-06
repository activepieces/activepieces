import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown } from '../common/props';

export const uploadFile = createAction({
  auth: airtopAuth,
  name: 'uploadFile',
  displayName: 'upload File to Session',
  description:
    'Push a file to one or more sessions, making it available for the sessions to use',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'ID of the file to push to sessions',
      required: true,
    }),
    sessionIds: Property.Array({
      displayName: 'Session IDs',
      description:
        'A list of session IDs to make the file available on. Leave empty to use the selected session.',
      required: false,
      defaultValue: [],
    }),
    sessionId: sessionIdDropdown,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { fileId, sessionIds, sessionId } = propsValue;

    const requestBody: any = {};

    // If sessionIds array is provided, use it; otherwise use the selected sessionId
    if (sessionIds && sessionIds.length > 0) {
      requestBody.sessionIds = sessionIds.join(',');
    } else if (sessionId) {
      requestBody.sessionIds = sessionId;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/files/${fileId}/push`,
      undefined,
      Object.keys(requestBody).length > 0 ? requestBody : undefined
    );

    return response;
  },
});
