import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const getClickupSpace = createAction({
  auth: clickupAuth,
  name: 'get_space',
  description: 'Gets a space in a ClickUp',
  displayName: 'Get Space',
  props: {
    space_id: Property.ShortText({
      description: 'The id of the space to get',
      displayName: 'Space ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { space_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `space/${space_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );
    return response.body;
  },
});
