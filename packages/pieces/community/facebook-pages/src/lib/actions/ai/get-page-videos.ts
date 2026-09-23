import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphList, GraphRecord } from '../../common/common';
import { pageVideosOutputSchema } from '../../output-schemas';

export const getPageVideosAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_page_videos',
  classification: 'SEARCH',
  displayName: 'Get Page Videos',
  description: 'Lists the videos uploaded by a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the videos a Facebook Page has uploaded, newest first, with each video ID, title, description, created time, length in seconds, permalink and thumbnail. A video ID is not a post ID. Paginated with After Cursor. Read-only.',
    idempotent: true,
  },
  outputSchema: pageVideosOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    limit: facebookPagesCommon.limit({ max: 100 }),
    after: facebookPagesCommon.after,
  },
  async run({ auth, propsValue }) {
    const response = await facebookPagesCommon.pageRequest<GraphList<GraphRecord>>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.GET,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/videos`,
      queryParams: {
        fields: 'id,title,description,created_time,updated_time,length,permalink_url,picture',
        ...facebookPagesCommon.cursorQuery({ limit: propsValue.limit, after: propsValue.after }),
      },
    });
    return facebookPagesCommon.toCursorPage({ response });
  },
});
