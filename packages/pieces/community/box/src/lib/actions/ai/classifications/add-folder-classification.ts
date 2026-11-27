import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const addFolderClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_add_folder_classification',
  displayName: 'Add Folder Classification',
  description: 'Applies a security classification to a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a classification label from List Classifications to a folder that has none. Fails with 409 if the folder is already classified: use Update Folder Classification then. Get the folder ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    classification: Property.ShortText({
      displayName: 'Classification',
      description: 'The classification label exactly as listed by List Classifications, e.g. "Confidential".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
      body: { Box__Security__Classification__Key: propsValue.classification },
    });
  },
});
