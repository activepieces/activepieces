import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetFileVersionOutputSchema } from '../../../output-schemas';

export const getFileVersionAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_version',
  outputSchema: boxGetFileVersionOutputSchema,
  displayName: 'Get File Version',
  description: 'Gets one version of a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one version of a file: name, size, sha1, who uploaded it and whether it is trashed. Get the version ID from List File Versions or the file_version of Get File.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    fileVersionId: boxAiProps.fileVersionId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/versions/${encodeURIComponent(propsValue.fileVersionId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
