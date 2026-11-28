import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCopyFileOutputSchema } from '../../../output-schemas';

export const restoreFileAction = createAction({
  auth: boxAuth,
  name: 'box_restore_file',
  outputSchema: boxCopyFileOutputSchema,
  displayName: 'Restore File',
  description: 'Restores a Box file from the trash.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a trashed file back to its original folder and returns it. Parent Folder ID is used only when the original folder no longer exists; a name clash there fails with 409 unless a new Name is given. Get the ID from List Trashed Items or the Delete File result.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true, description: 'ID of the trashed file. Get it from List Trashed Items.' }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the restored file, to avoid a name clash.',
      required: false,
    }),
    parentFolderId: boxAiProps.folderId({
      required: false,
      displayName: 'Parent Folder ID',
      description: 'Folder to restore into if the original folder no longer exists.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/files/${encodeURIComponent(propsValue.fileId)}`,
      query: { fields: propsValue.fields },
      body: {
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.parentFolderId !== undefined ? { parent: { id: propsValue.parentFolderId } } : {}),
      },
    });
  },
});
