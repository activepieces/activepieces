import { medullarAuth } from '../../index';
import { createAction,Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { medullarCommon } from '../common';
import { medullarPropsCommon } from '../common';

export const renameSpace = createAction({
  auth: medullarAuth,
  name: 'renameSpace',
  displayName: 'Rename Space',
  description: 'Rename an existing Space.',
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
      url: `${medullarCommon.exploratorUrl}/spaces/${context.propsValue.spaceId}/`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
      body: {
        name: context.propsValue.space_name,
      },
    });

    return response.body;
  },
});
