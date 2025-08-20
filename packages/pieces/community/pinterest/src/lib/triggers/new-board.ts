import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
  getAccessTokenOrThrow,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { adAccountIdDropdown } from '../common/props';

const polling: Polling<
  PiecePropValueSchema<typeof pinterestAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { ad_account_id, privacy_filter, page_size } = propsValue;
    let bookmark: string | undefined = undefined;
    let boards: any[] = [];
    let pageCount = 0;
    const maxPages = 10; // Limit to prevent excessive API calls

    do {
      pageCount++;

      // Build query parameters
      const searchParams = new URLSearchParams();

      // Add page_size parameter
      searchParams.append('page_size', (page_size || 25).toString());

      if (bookmark) {
        searchParams.append('bookmark', bookmark);
      }
      if (ad_account_id) {
        searchParams.append('ad_account_id', ad_account_id);
      }
      if (privacy_filter && privacy_filter !== 'ALL') {
        searchParams.append('privacy', privacy_filter);
      }

      const queryString = searchParams.toString();
      const path = `/boards${queryString ? `?${queryString}` : ''}`;

      try {
        const response = await makeRequest(
          getAccessTokenOrThrow(auth as OAuth2PropertyValue),
          HttpMethod.GET,
          path
        );

        const items = response.items || [];
        boards = boards.concat(items);
        bookmark = response.bookmark;

        // Break early if we've found items older than last fetch
        if (lastFetchEpochMS && items.length > 0) {
          const hasNew = items.some(
            (item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS
          );
          if (!hasNew) break;
        }

        // Rate limiting awareness
        if (bookmark && pageCount < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error fetching boards:', error);
        break;
      }
    } while (bookmark && pageCount < maxPages);

    // Filter by timestamp if this isn't the first run
    if (lastFetchEpochMS) {
      boards = boards.filter(
        (item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS
      );
    }

    return boards.map((item) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newBoard = createTrigger({
  auth: pinterestAuth,
  name: 'newBoard',
  displayName: 'New Board',
  description: 'Fires when a new board is created in the account.',
  props: {
    ad_account_id: adAccountIdDropdown,
    privacy_filter: Property.StaticDropdown({
      displayName: 'Board Privacy Filter',
      required: false,
      options: {
        options: [
          { label: 'All Boards', value: 'ALL' },
          { label: 'Public Only', value: 'PUBLIC' },
          { label: 'Protected Only', value: 'PROTECTED' },
          { label: 'Secret Only', value: 'SECRET' },
          { label: 'Public and Secret', value: 'PUBLIC_AND_SECRET' },
        ],
      },
      description: 'Filter boards by privacy setting (optional).',
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Number of boards to fetch per page (1-250, default: 25).',
    }),
  },
  sampleData: {
    id: '549755885175',
    created_at: '2020-01-01T20:10:40-00:00',
    board_pins_modified_at: '2020-01-01T20:10:40-00:00',
    name: 'Summer Recipes',
    description: 'My favorite summer recipes',
    collaborator_count: 17,
    pin_count: 5,
    follower_count: 13,
    media: {
      image_cover_url:
        'https://i.pinimg.com/400x300/fd/cd/d5/fdcdd5a6d8a80824add0d054125cd957.jpg',
      pin_thumbnail_urls: [
        'https://i.pinimg.com/150x150/b4/57/10/b45710f1ede96af55230f4b43935c4af.jpg',
        'https://i.pinimg.com/150x150/dd/ff/46/ddff4616e39c1935cd05738794fa860e.jpg',
        'https://i.pinimg.com/150x150/84/ac/59/84ac59b670ccb5b903dace480a98930c.jpg',
        'https://i.pinimg.com/150x150/4c/54/6f/4c546f521be85e30838fb742bfff6936.jpg',
      ],
    },
    owner: {
      username: 'sample_username',
    },
    privacy: 'PUBLIC',
    is_ads_only: false,
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
