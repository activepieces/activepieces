import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const deleteList = createAction({
  auth: villageAuth,
  name: 'delete_list',
  displayName: 'Delete a list',
  description:
    'Permanently delete a list and all its items. This action cannot be undone.',
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${VILLAGE_API_BASE_URL}/v2/lists/${encodeURIComponent(id)}`,
      headers: { Authorization: `Bearer ${context.auth}` },
    });
    return response.body;
  },
});
