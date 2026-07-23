import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetList = createAction({
  auth: clickupAuth,
  name: 'clickup_get_list',
  description: 'Get a single ClickUp list by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: fetch the details of one ClickUp list (including its available statuses) by list ID. Use when you already know the list ID; to discover list IDs first, use Get Folder Lists or Get Folderless Lists. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get List',
  props: {
    list_id: Property.ShortText({
      description: 'The ID of the list to get',
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
