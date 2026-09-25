import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { deleteFolderActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const deleteFolderAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_folder',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Folder',
  description: 'Deletes a folder and everything inside it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a monday.com folder together with ALL boards, docs and sub-folders inside it. Destructive: only use when the user explicitly asks to delete the folder and its contents; to keep the boards, move them out first with Move Board, or archive boards individually with Archive Board. A retry after success fails because the folder is gone.',
    idempotent: false,
  },
  outputSchema: deleteFolderActionOutputSchema,
  props: {
    folder_id: mondayAiProps.folderId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ delete_folder: { id: string; name: string | null } }>({
      query: `mutation ($folder_id: ID!) {
        delete_folder(folder_id: $folder_id) { id name }
      }`,
      variables: { folder_id: context.propsValue.folder_id },
    });

    return {
      id: data.delete_folder.id,
      name: data.delete_folder.name ?? null,
      deleted: true,
    };
  },
});
