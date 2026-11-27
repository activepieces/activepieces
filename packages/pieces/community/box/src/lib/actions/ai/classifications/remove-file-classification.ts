import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeFileClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_remove_file_classification',
  displayName: 'Remove File Classification',
  description: 'Removes the security classification from a Box file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the classification label from a file; Add File Classification can apply one again. Fails with 404 when the file has no classification. Get the file ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/enterprise/securityClassification-6VMVochwUWo`,
    });
    return { removed: true, fileId: propsValue.fileId };
  },
});
