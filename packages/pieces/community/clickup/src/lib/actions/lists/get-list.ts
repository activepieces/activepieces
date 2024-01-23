import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const getClickupList = createAction({
  auth: clickupAuth,

  name: 'get_list',
  description: 'Gets a list in a ClickUp',
  displayName: 'Get List',
  props: {
    list_id: Property.ShortText({
      description: 'The id of the list to get',
      displayName: 'List ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `list/${list_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
