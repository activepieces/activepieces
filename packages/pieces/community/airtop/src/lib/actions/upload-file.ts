import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { fileId } from '../common/props';

export const uploadFileToSessionAction = createAction({
  auth: airtopAuth,
  name: 'upload-file-to-session',
  displayName: 'Upload File to Session',
  description: 'Pushes an existing file to a session to make it available (e.g., for use in a file input).',
  props: {
    fileId: fileId,
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The ID of the session to push the file to.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { fileId, sessionId } = propsValue;

    const result = await airtopApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      resourceUri: `/files/${fileId}/push`,
      body: {
        sessionIds: [sessionId],
      },
    });

    return {
      fileId,
      message: 'File successfully pushed to the session.',
      result,
    };
  },
});
