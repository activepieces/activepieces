import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateList = createAction({
  auth: clickupAuth,
  name: 'clickup_update_list',
  description: 'Update an existing ClickUp list',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update properties of an existing ClickUp list (such as renaming it or changing its content) by list ID. Pick this to modify a list you already have the ID for; use Create List to make a new one. Only the fields you supply are changed, so repeating the same update yields the same end state.',
    idempotent: true,
  },
  displayName: 'Update List',
  props: {
    list_id: Property.ShortText({
      description: 'The ID of the list to update',
      displayName: 'List ID',
      required: true,
    }),
    name: Property.ShortText({
      description: 'The new name for the list',
      displayName: 'List Name',
      required: false,
    }),
    content: Property.LongText({
      description: 'The new description/content for the list',
      displayName: 'Content',
      required: false,
    }),
  },
  async run(configValue) {
    const { list_id, name, content } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.PUT,
      `list/${list_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
        content,
      }
    );

    return response.body;
  },
});
