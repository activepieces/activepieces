import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteFolder = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_folder',
  description: 'Delete a ClickUp folder by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a ClickUp folder (and all lists and tasks it contains) by folder ID. This is destructive and cannot be undone, so confirm the ID before calling. Resolve the folder ID with Get Folders for the intended space first — do not reuse a stale or copied ID, as any folder the connection can access will be deleted. Deleting an already-deleted folder fails rather than succeeding, so treat it as non-idempotent.',
    idempotent: false,
  },
  displayName: 'Delete Folder',
  props: {
    folder_id: Property.ShortText({
      description: 'The ID of the folder to delete',
      displayName: 'Folder ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { folder_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `folder/${folder_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
