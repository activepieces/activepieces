import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import { beamerGetFeedUrlOutputSchema } from '../../../output-schemas';

export const getFeedUrlAction = createAction({
  auth: beamerAuth,
  name: 'beamer_get_feed_url',
  outputSchema: beamerGetFeedUrlOutputSchema,
  displayName: 'Get Feed URL',
  description: 'Gets the URL of your Beamer news feed, optionally for one end user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the URL of the Beamer standalone news feed, to show it in an iframe or web view. Pass the end user\'s ID, email or name to attribute their views in Beamer Analytics; Count Unread Posts returns the same URL along with the unread count.',
    idempotent: true,
  },
  props: {
    userId: beamerAiProps.viewerUserId({ required: false }),
    userEmail: beamerAiProps.viewerUserEmail({ required: false }),
    userFirstName: beamerAiProps.viewerFirstName({ required: false }),
    userLastName: beamerAiProps.viewerLastName({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await beamerClient.request<BeamerFeedUrl>({
      auth,
      method: HttpMethod.GET,
      path: '/url',
      query: {
        userId: propsValue.userId,
        userEmail: propsValue.userEmail,
        userFirstName: propsValue.userFirstName,
        userLastName: propsValue.userLastName,
      },
    });
  },
});

type BeamerFeedUrl = { url: string };
