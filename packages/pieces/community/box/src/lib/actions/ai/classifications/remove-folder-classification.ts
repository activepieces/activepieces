import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeFolderClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_remove_folder_classification',
  displayName: 'Remove Folder Classification',
  description: 'Removes the security classification from a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the classification label from a folder; Add Folder Classification can apply one again. Fails with 404 when the folder has no classification. Get the folder ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
    });
    return { removed: true, folderId: propsValue.folderId };
  },
});
