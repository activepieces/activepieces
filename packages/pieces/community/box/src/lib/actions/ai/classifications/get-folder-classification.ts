import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getFolderClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_get_folder_classification',
  displayName: 'Get Folder Classification',
  description: 'Gets the security classification on a Box folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the classification label on a folder in Box__Security__Classification__Key. Fails with 404 when the folder has no classification. Get the folder ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
    });
  },
});
