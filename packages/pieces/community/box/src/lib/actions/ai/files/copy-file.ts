import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const copyFileAction = createAction({
  auth: boxAuth,
  name: 'box_copy_file',
  displayName: 'Copy File',
  description: 'Copies a Box file into a folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a Box file into a folder and returns the new copy with its ID. Fails with 409 if the target folder already has a file with that name, so give a new Name when copying into the same folder. Get folder IDs from List Folder Items or Create Folder.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    parentFolderId: boxAiProps.folderId({
      required: true,
      displayName: 'Destination Folder ID',
      description: 'ID of the folder to copy the file into. "0" is the root "All Files" folder.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name for the copy. Defaults to the original name.',
      required: false,
    }),
    version: boxAiProps.fileVersionId({
      required: false,
      displayName: 'Version ID',
      description: 'ID of a past file version to copy instead of the current one. Get it from List File Versions.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/copy`,
      query: { fields: propsValue.fields },
      body: {
        parent: { id: propsValue.parentFolderId },
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.version !== undefined ? { version: propsValue.version } : {}),
      },
    });
  },
});
