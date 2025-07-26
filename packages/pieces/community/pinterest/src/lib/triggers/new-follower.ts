import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<
  PiecePropValueSchema<typeof pinterestAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
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
          auth.access_token as string,
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
  displayName: 'New Follower',
  description: 'Triggers when a user gains a new follower.',
  props: {},
  sampleData: {
    username: 'sample_username',
    type: 'user',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test<
      PiecePropValueSchema<typeof pinterestAuth>,
      Record<string, any>
    >(polling, context as any);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable<
      PiecePropValueSchema<typeof pinterestAuth>,
      Record<string, any>
    >(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable<
      PiecePropValueSchema<typeof pinterestAuth>,
      Record<string, any>
    >(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll<
      PiecePropValueSchema<typeof pinterestAuth>,
      Record<string, any>
    >(polling, context as any);
  },
});
