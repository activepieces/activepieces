import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetFilesOutputSchema } from '../../../output-schemas';

export const getLatestFilesOnSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_latest_files_on_space',
  outputSchema: podioGetFilesOutputSchema,
  displayName: 'Get Latest Files On Space',
  description: 'Lists the most recently uploaded files on a workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the files on a Podio workspace, newest upload first, at most 50 per call. Use Get Files On Space to filter or sort differently. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of files to return, up to 50. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/file/space/${propsValue.spaceId}/latest/`,
      query: podioUtils.query({ values: { limit: Math.min(propsValue.limit ?? 10, 50), offset: propsValue.offset } }),
    });
    return { files: body, count: body.length };
  },
});
