import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetFilePublicLinkOutputSchema } from '../../../output-schemas';

export const getFilePublicLinkAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_file_public_link',
  outputSchema: mattermostGetFilePublicLinkOutputSchema,
  displayName: 'Get File Public Link',
  description: 'Gets a link that opens a file without signing in.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a public link anyone can open without a Mattermost account. Needs public file links enabled on the server, and the file must already be attached to a post. Needs read access to the file\'s channel.',
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
      path: `/files/${encodeURIComponent(context.propsValue.fileId)}/link`,
    });
  },
});
