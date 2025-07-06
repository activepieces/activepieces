import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { fileIdDropdown, sessionIdsMultiselectDropdown } from '../common/props';

export const uploadFile = createAction({
  auth: airtopAuth,
  name: 'uploadFile',
  displayName: 'Push File to Session',
  description:
    'Push a file to one or more sessions, making it available for the sessions to use',
  props: {
    fileId: fileIdDropdown,
    sessionIds: sessionIdsMultiselectDropdown,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { fileId, sessionIds } = propsValue;

    const requestBody: any = {
      sessionIds: sessionIds.join(','),
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/files/${fileId}/push`,
      undefined,
      requestBody
    );
    return response;
  },
});
