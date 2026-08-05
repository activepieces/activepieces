import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  OAuth2PropertyValue,
  AppConnectionValueForAuthProperty,
  isNil,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
  getAccessTokenOrThrow,
} from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { newFollowerTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof pinterestAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) => {
    let bookmark: string | undefined = undefined;
    let followers: any[] = [];
    let pageCount = 0;
    const maxPages = 20; // Limit to prevent excessive API calls

    do {
      pageCount++;

      // Build query parameters
      const searchParams = new URLSearchParams();
      if (bookmark) {
        searchParams.append('bookmark', bookmark);
      }

      const queryString = searchParams.toString();
      const path = `/user_account/followers${
        queryString ? `?${queryString}` : ''
      }`;

      try {
        const response = await makeRequest(
          getAccessTokenOrThrow(auth as OAuth2PropertyValue),
          HttpMethod.GET,
          path
        );

        const items = response.items || [];
        followers = followers.concat(items);
        bookmark = response.bookmark;

        // Rate limiting awareness - add delay between requests
        if (bookmark && pageCount < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        // Returning the pages read so far would let pollingHelper store the
        // newest follower it did receive as `lastItem`. On the next poll that id
        // is found on page one, so everything after it counts as already seen
        // and the followers on the pages we never reached are never emitted.
        // Fail the poll instead, leaving `lastItem` untouched.
        //
        // A first/sample run has no `lastItem` to corrupt, so best-effort is
        // fine. isNil rather than truthiness: the id is a username, and an empty
        // string is a real checkpoint that must not be treated as a first run.
        if (!isNil(lastItemId)) {
          throw error;
        }
        console.error('Error fetching followers:', error);
        break;
      }
    } while (bookmark && pageCount < maxPages);

    // Return items with username as identifier
    return followers.map((item) => ({
      id: item.username,
      data: item,
    }));
  },
};

export const newFollower = createTrigger({
  auth: pinterestAuth,
  name: 'newFollower',
  outputSchema: newFollowerTriggerOutputSchema,
  displayName: 'New Follower',
  description: 'Triggers when a user gains a new follower.',
  aiMetadata: {
    description:
      "Fires when the authenticated Pinterest account gains a new follower, emitting the follower's account info. Polls the account's followers list and emits entries not seen before.",
  },
  props: {},
  sampleData: {
    username: 'sample_username',
    type: 'user',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
