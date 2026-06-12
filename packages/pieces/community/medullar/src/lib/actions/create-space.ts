import { medullarAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { medullarCommon, getUser } from '../common';

export const createSpace = createAction({
  auth: medullarAuth,
  name: 'createSpace',
  displayName: 'Create new Space',
  description: 'Create a new Space.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new Medullar Space (a knowledge container scoped to the authenticated user\'s company) with the given name. Use to set up a fresh Space before adding records or asking questions. Not idempotent: each call creates a separate Space even with the same name.', idempotent: false },
  props: {
    space_name: Property.ShortText({
      displayName: 'Space Name',
      required: true,
    }),
  },
  async run(context) {
    const userData = await getUser(context.auth);

    const spaceResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${medullarCommon.aiUrl}/spaces/`,
      body: {
        name: context.propsValue['space_name'],
        company: {
          uuid: userData.company.uuid,
        },
      },
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
    });

    return spaceResponse.body;
  },
});
