import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphList, GraphRecord } from '../../common/common';
import { scheduledPostsOutputSchema } from '../../output-schemas';

export const getScheduledPostsAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_scheduled_posts',
  classification: 'SEARCH',
  displayName: 'Get Scheduled Posts',
  description: 'Lists the scheduled, not yet published posts of a Facebook Page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the posts on a Facebook Page that are scheduled but not yet published, with each post ID, message, created time and scheduled publish time. Use the IDs with Publish Scheduled Post, Reschedule Post or Delete Post. Paginated with After Cursor. Read-only.',
    idempotent: true,
  },
  outputSchema: scheduledPostsOutputSchema,
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
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/scheduled_posts`,
      queryParams: {
        fields: 'id,message,created_time,scheduled_publish_time,permalink_url,is_published,full_picture',
        ...facebookPagesCommon.cursorQuery({ limit: propsValue.limit, after: propsValue.after }),
      },
    });
    return facebookPagesCommon.toCursorPage({ response });
  },
});
