import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { listId } from '../common/props';

export const findListByNameAction = createAction({
  auth: klaviyoAuth,
  name: 'find-list-by-id',
  displayName: 'Find List',
  description: 'Retrieve detailed information about a specific list.',
  props: {
    listId,
  },
  async run({ auth, propsValue }) {
    const { listId } = propsValue;

    const response = await klaviyoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: `/lists/${listId}`,
      headers: {
        revision: '2025-04-15',
        accept: 'application/vnd.api+json',
      },
    });

    return response;
  },
});
