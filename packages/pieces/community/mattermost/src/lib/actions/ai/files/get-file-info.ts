import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetFileInfoOutputSchema } from '../../../output-schemas';

export const getFileInfoAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_file_info',
  outputSchema: mattermostGetFileInfoOutputSchema,
  displayName: 'Get File Info',
  description: 'Gets a file\'s name, size, type and post.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a file\'s stored metadata (name, extension, size, MIME type, uploader, post and channel) without downloading it. Use Download File for the contents. Needs read access to the file\'s channel.',
    idempotent: true,
  },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File ID (26 characters). Use Upload File, Search Files or List Post Files to find it.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(context.propsValue.fileId)}/info`,
    });
  },
});
