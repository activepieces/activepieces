import { medullarAuth } from '../auth';
import { createAction,Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { medullarCommon } from '../common';
import { medullarPropsCommon } from '../common';

export const renameSpace = createAction({
  auth: medullarAuth,
  name: 'renameSpace',
  displayName: 'Rename Space',
  description: 'Rename an existing Space.',
  audience: 'both',
  aiMetadata: { description: 'Updates the name of an existing Medullar Space identified by its UUID. Use to relabel a Space without affecting its records or chats. Idempotent: repeating with the same UUID and name leaves the Space at that name.', idempotent: true },
  props: {
    spaceId: medullarPropsCommon.spaceId,
    space_name: Property.ShortText({
          displayName: 'Space Name',
          required: true,
        }),
  },
  async run(context) {

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${medullarCommon.aiUrl}/spaces/${context.propsValue.spaceId}/`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
      body: {
        name: context.propsValue.space_name,
      },
    });

    return response.body;
  },
});
