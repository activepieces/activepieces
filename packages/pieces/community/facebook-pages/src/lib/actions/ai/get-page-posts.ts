import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphList, GraphRecord } from '../../common/common';
import { pagePostsOutputSchema } from '../../output-schemas';

export const getPagePostsAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_page_posts',
  classification: 'SEARCH',
  displayName: 'Get Page Posts',
  description: 'Lists the posts published by a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the posts a Facebook Page has published, newest first, with each post ID (PageID_PostID), message, created and updated time, permalink and main picture. Does not include scheduled posts (use Get Scheduled Posts) or posts by other people that tag the Page. Paginated with After Cursor. Read-only.',
    idempotent: true,
  },
  outputSchema: pagePostsOutputSchema,
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
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/posts`,
      queryParams: {
        fields: 'id,message,created_time,updated_time,permalink_url,status_type,full_picture,is_published',
        ...facebookPagesCommon.cursorQuery({ limit: propsValue.limit, after: propsValue.after }),
      },
    });
    return facebookPagesCommon.toCursorPage({ response });
  },
});
