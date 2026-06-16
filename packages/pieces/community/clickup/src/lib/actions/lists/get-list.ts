import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const getClickupList = createAction({
  auth: clickupAuth,

  name: 'get_list',
  description: 'Gets a list in a ClickUp',
  audience: 'both',
  aiMetadata: { description: 'Read-only: fetch the details of a single ClickUp list by its list ID. Use when you already know the list ID; does not modify anything and is safe to call repeatedly.', idempotent: true },
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
