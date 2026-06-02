import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const updateList = createAction({
  auth: villageAuth,
  name: 'update_list',
  displayName: 'Update a list',
  description:
    "Update a list's metadata. Provide at least one of: title or description. The list type cannot be changed after creation.",
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New list title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New list description. Leave blank to keep unchanged.',
      required: false,
    }),
  },
  async run(context) {
    const { id, title, description } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (title !== undefined) body['title'] = title;
    if (description !== undefined) body['description'] = description;

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided for update (title or description)');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${VILLAGE_API_BASE_URL}/v2/lists/${encodeURIComponent(id)}`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
