import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteFolderOutputSchema } from '../../../output-schemas';

export const deleteFolderAction = createAction({
  auth: boxAuth,
  name: 'box_delete_folder',
  outputSchema: boxDeleteFolderOutputSchema,
  displayName: 'Delete Folder',
  description: 'Moves a Box folder to the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves a Box folder to the trash, where Restore Folder can bring it back until the trash is emptied; use Delete Folder Permanently on a trashed folder to remove it for good. A folder with content fails unless Recursive is "true". Get the ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    recursive: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Recursive',
      description: '"true" to also trash everything inside; required when the folder is not empty.',
    }),
    etag: boxAiProps.etag({
      required: false,
      description: "The folder's last seen etag (from Get Folder). The delete fails with 412 if the folder changed since.",
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}`,
      query: { recursive: propsValue.recursive === undefined ? undefined : String(propsValue.recursive === 'true') },
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
    });
    return { trashed: true, folderId: propsValue.folderId };
  },
});
