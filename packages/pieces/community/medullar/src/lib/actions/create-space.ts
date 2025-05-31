import { medullarAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { medullarCommon, getUser } from '../common';

export const createSpace = createAction({
  auth: medullarAuth,
  name: 'createSpace',
  displayName: 'Create new Space',
  description: 'Create a new Space.',
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
      url: `${medullarCommon.exploratorUrl}/spaces/`,
      body: {
        name: context.propsValue['space_name'],
        company: {
          uuid: userData.company.uuid,
        },
      },
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    return spaceResponse.body;
  },
});
