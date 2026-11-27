import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const addFileClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_add_file_classification',
  displayName: 'Add File Classification',
  description: 'Applies a security classification to a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a classification label from List Classifications to a file that has none. Fails with 409 if the file is already classified: use Update File Classification then. Get the file ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
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
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
      body: { Box__Security__Classification__Key: propsValue.classification },
    });
  },
});
