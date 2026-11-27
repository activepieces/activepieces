import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getFileClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_classification',
  displayName: 'Get File Classification',
  description: 'Gets the security classification on a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the classification label on a file in Box__Security__Classification__Key. Fails with 404 when the file has no classification. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
    });
  },
});
