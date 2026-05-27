import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const createList = createAction({
  auth: villageAuth,
  name: 'create_list',
  displayName: 'Create a list',
  description:
    'Create a new list to organize people or companies. The creator becomes the list owner. List creation may be limited based on your subscription plan.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'List title',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Type of entities in the list',
      required: false,
      defaultValue: 'people',
      options: {
        options: [
          { label: 'People', value: 'people' },
          { label: 'Company', value: 'company' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional list description',
      required: false,
    }),
    is_public: Property.Checkbox({
      displayName: 'Is Public',
      description: 'Whether the list is publicly accessible',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { title, type, description, is_public } = context.propsValue;

    const body: Record<string, unknown> = { title };
    if (type) body['type'] = type;
    if (description !== undefined) body['description'] = description;
    if (is_public !== undefined) body['is_public'] = is_public;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/lists`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
