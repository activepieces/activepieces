import { medullarAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createSpace = createAction({
  auth: medullarAuth,
  name: 'createSpace',
  displayName: 'Create new space',
  description: 'Create a new workspace for the currently authenticated user.',
  props: {
    space_name: Property.ShortText({
      displayName: 'Space Name',
      required: true,
    }),
  },
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'http://my.medullar.com/api/v1.0/spaces/',
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });
    return res.body;
  },
});
