import { medullarAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { medullarCommon } from '../common';
import { medullarPropsCommon } from '../common';

export const deleteSpace = createAction({
  auth: medullarAuth,
  name: 'deleteSpace',
  displayName: 'Delete Space',
  description: 'Delete an existing Space.',
  props: {
    spaceId: medullarPropsCommon.spaceId,
  },
  async run(context) {

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${medullarCommon.aiUrl}/spaces/${context.propsValue.spaceId}/`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
    });

    return {deleted: true, spaceId: context.propsValue.spaceId};
  },
});
