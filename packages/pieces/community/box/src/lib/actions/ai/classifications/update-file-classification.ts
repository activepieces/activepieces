import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateFileClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_update_file_classification',
  displayName: 'Update File Classification',
  description: 'Changes the security classification on a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the classification label on a file that already has one with another label from List Classifications; use Add File Classification for an unclassified file. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
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
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
      headers: { 'content-type': 'application/json-patch+json' },
      body: [{ op: 'replace', path: '/Box__Security__Classification__Key', value: propsValue.classification }],
    });
  },
});
