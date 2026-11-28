import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import { beamerUtils } from '../../../common/utils';
import { beamerCountUnreadPostsOutputSchema } from '../../../output-schemas';

export const countUnreadPostsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_count_unread_posts',
  outputSchema: beamerCountUnreadPostsOutputSchema,
  displayName: 'Count Unread Posts',
  description: 'Counts the published posts an end user has not read yet.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many live posts one end user has not read, plus their feed URL, without marking anything as read. Use List Unread Posts to read the posts themselves.',
    idempotent: true,
  },
  props: {
    userId: beamerAiProps.viewerUserId({ required: true }),
    userEmail: beamerAiProps.viewerUserEmail({ required: false }),
    userFirstName: beamerAiProps.viewerFirstName({ required: false }),
    userLastName: beamerAiProps.viewerLastName({ required: false }),
    category: beamerAiProps.category({ required: false }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkCategory({ category: propsValue.category });
    return await beamerClient.request<BeamerUnreadCount>({
      auth,
      method: HttpMethod.GET,
      path: '/unread/count',
      query: {
        userId: propsValue.userId,
        userEmail: propsValue.userEmail,
        userFirstName: propsValue.userFirstName,
        userLastName: propsValue.userLastName,
        category: propsValue.category,
        dateFrom: propsValue.dateFrom,
      },
    });
  },
});

type BeamerUnreadCount = { count: number; url?: string; popupUrl?: string };
