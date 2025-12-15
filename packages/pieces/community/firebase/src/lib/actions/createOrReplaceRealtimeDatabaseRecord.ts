import { createAction, Property } from '@activepieces/pieces-framework';
import { firestoreAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createOrReplaceRealtimeDatabaseRecord = createAction({
  auth: firestoreAuth,
  name: 'createOrReplaceRealtimeDatabaseRecord',
  displayName: 'Create or Replace Realtime Database Record',
  description: 'Create or replace a record in Firebase Realtime Database using PUT request',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your Firebase project ID (e.g., my-project)',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path to the record (e.g., users/user1 or posts/post1)',
      required: false,
    }),
    data: Property.Object({
      displayName: 'Data',
      description: 'The data to write (will replace entire record at path)',
      required: true,
    }),
  },
  async run(context) {
    const { projectId, path, data } = context.propsValue;
    const { access_token } = context.auth;
    const baseUrl = `https://${projectId}.firebaseio.com`;
    const cleanPath = path?.replace(/^\//, '') || '';
    const url = `${baseUrl}/${cleanPath}.json`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url,
      body: data,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.body;
  },
});
