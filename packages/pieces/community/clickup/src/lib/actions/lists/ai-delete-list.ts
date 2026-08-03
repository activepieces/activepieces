import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteList = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_list',
  description: 'Delete a ClickUp list by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a ClickUp list (and all tasks it contains) by list ID. This is destructive and cannot be undone, so confirm the ID before calling. Resolve the list ID with Get Folder Lists / Get Folderless Lists for the intended folder/space first — do not reuse a stale or copied ID, as any list the connection can access will be deleted. Deleting an already-deleted list fails rather than succeeding, so treat it as non-idempotent.',
    idempotent: false,
  },
  displayName: 'Delete List',
  props: {
    list_id: Property.ShortText({
      description: 'The ID of the list to delete',
      displayName: 'List ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `list/${list_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
