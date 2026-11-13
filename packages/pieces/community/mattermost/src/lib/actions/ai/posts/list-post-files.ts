import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListPostFilesOutputSchema } from '../../../output-schemas';

export const listPostFilesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_post_files',
  outputSchema: mattermostListPostFilesOutputSchema,
  displayName: 'List Post Files',
  description: 'Lists the files attached to a post.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the info (ID, name, extension, size, MIME type) of every file attached to a post. Pass a file ID to the file actions to download or link it.',
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Deleted',
      description: '"true" to include files of a deleted post; needs system admin permission. Defaults to "false".',
    }),
  },
  async run(context) {
    const { postId, includeDeleted } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    const files = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(postId)}/files/info`,
      query: deleted !== undefined ? { include_deleted: String(deleted) } : undefined,
    });
    return { files, count: files.length };
  },
});
