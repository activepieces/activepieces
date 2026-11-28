import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetFileVersionOutputSchema } from '../../../output-schemas';

export const promoteFileVersionAction = createAction({
  auth: boxAuth,
  name: 'box_promote_file_version',
  outputSchema: boxGetFileVersionOutputSchema,
  displayName: 'Promote File Version',
  description: 'Makes a past version of a Box file the current version.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a past version to the top of the version history so the file\'s content becomes that version again, and returns the new current version. Each call adds a version. Not for Box Notes. Get the version ID from List File Versions.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    fileVersionId: boxAiProps.fileVersionId({
      required: true,
      description: 'ID of the version to promote. Get it from List File Versions.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/versions/current`,
      query: { fields: propsValue.fields },
      body: { type: 'file_version', id: propsValue.fileVersionId },
    });
  },
});
