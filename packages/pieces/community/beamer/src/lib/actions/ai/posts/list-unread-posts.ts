import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import type { BeamerPost } from '../../../common/types';
import { beamerUtils } from '../../../common/utils';
import { beamerListUnreadPostsOutputSchema } from '../../../output-schemas';

export const listUnreadPostsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_list_unread_posts',
  outputSchema: beamerListUnreadPostsOutputSchema,
  displayName: 'List Unread Posts',
  description: 'Lists the published posts an end user has not read yet.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Lists the live posts (no drafts, archived, expired or scheduled ones) that one end user has not read, at most 10 per page. By default it asks Beamer to mark the returned posts as read; on plans without cross-device sync Beamer may not keep that, so the posts can show as unread again. Set Mark As Read to "false" to only look. Use Count Unread Posts for just the number.',
    idempotent: false,
  },
  props: {
    userId: beamerAiProps.viewerUserId({ required: true }),
    userEmail: beamerAiProps.viewerUserEmail({ required: false }),
    userFirstName: beamerAiProps.viewerFirstName({ required: false }),
    userLastName: beamerAiProps.viewerLastName({ required: false }),
    markAsRead: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Mark As Read',
      description: '"true" (default) marks the returned posts as read for this user, "false" leaves them unread.',
    }),
    category: beamerAiProps.category({ required: false }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    limit: beamerAiProps.limit({ required: false }),
    page: beamerAiProps.page({ required: false }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkCategory({ category: propsValue.category });
    beamerUtils.toBoolean({ value: propsValue.markAsRead, propName: 'markAsRead' });
    const posts = await beamerClient.request<BeamerPost[]>({
      auth,
      method: HttpMethod.GET,
      path: '/unread',
      query: {
        userId: propsValue.userId,
        userEmail: propsValue.userEmail,
        userFirstName: propsValue.userFirstName,
        userLastName: propsValue.userLastName,
        markAsRead: propsValue.markAsRead,
        category: propsValue.category,
        dateFrom: propsValue.dateFrom,
        maxResults: beamerUtils.pageSize({ limit: propsValue.limit }),
        page: propsValue.page === undefined ? undefined : String(propsValue.page),
        ignoreRequestDetails: 'true',
      },
    });
    return { posts, count: posts.length };
  },
});
