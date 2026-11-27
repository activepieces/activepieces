import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateFolderClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_update_folder_classification',
  displayName: 'Update Folder Classification',
  description: 'Changes the security classification on a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the classification label on a folder that already has one with another label from List Classifications; use Add Folder Classification for an unclassified folder. Get the folder ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    classification: Property.ShortText({
      displayName: 'Classification',
      description: 'The new classification label exactly as listed by List Classifications, e.g. "Confidential".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
      headers: { 'content-type': 'application/json-patch+json' },
      body: [{ op: 'replace', path: '/Box__Security__Classification__Key', value: propsValue.classification }],
    });
  },
});
