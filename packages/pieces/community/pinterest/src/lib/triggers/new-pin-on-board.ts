import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  OAuth2PropertyValue,
  AppConnectionValueForAuthProperty,
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
import { adAccountIdDropdown, boardIdDropdown } from '../common/props';
import { newPinOnBoardTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof pinterestAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const { board_id, ad_account_id, creative_types } = propsValue;
    let bookmark: string | undefined = undefined;
    let pins: any[] = [];
    let pageCount = 0;
    const maxPages = 10; // Limit to prevent excessive API calls
    const initialPageSize = 25; // Smaller initial page size for faster response

    do {
      pageCount++;
      // Build query parameters
      const searchParams = new URLSearchParams();
      searchParams.append('page_size', initialPageSize.toString());
      if (bookmark) {
        searchParams.append('bookmark', bookmark);
      }

      if (ad_account_id) {
        searchParams.append('ad_account_id', ad_account_id);
      }

      // Add creative_types filter if specified
      if (creative_types && creative_types.length > 0) {
        creative_types.forEach((type: string) => {
          searchParams.append('creative_types', type);
        });
      }

      const queryString = searchParams.toString();
      const path = `/boards/${board_id}/pins${
        queryString ? `?${queryString}` : ''
      }`;
      try {
        const response = await makeRequest(
          getAccessTokenOrThrow(auth as OAuth2PropertyValue),
          HttpMethod.GET,
          path
        );
        const items = response.items || [];
        bookmark = response.bookmark;

        // If this is not the first run, filter items by timestamp immediately
        if (lastFetchEpochMS) {
          const newItems = items.filter(
            (item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS
          );

          pins = pins.concat(newItems);

          // Break early if no new items found in this page
          if (newItems.length === 0) {
            break;
          }

          // Break early if we found items older than last fetch
          const hasOldItems = items.some(
            (item: any) => dayjs(item.created_at).valueOf() <= lastFetchEpochMS
          );
          if (hasOldItems) {
            break;
          }

          // Rate limiting awareness - add delay between requests
          if (bookmark && pageCount < maxPages) {
            await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
          }
        } else {
          // First run - collect all items
          pins = pins.concat(items);
        }
      } catch (error) {
        console.error(`Error fetching pins for board ${board_id}:`, error);
        break; // Stop pagination on error
      }
    } while (bookmark);

    // Sort by creation date (newest first) for consistent ordering
    pins.sort(
      (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
    );

    return pins.map((item) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newPinOnBoard = createTrigger({
  auth: pinterestAuth,
  name: 'newPinOnBoard',
  outputSchema: newPinOnBoardTriggerOutputSchema,
  displayName: 'New Pin on Board',
  description: 'Fires when a new Pin is added to a specific board.',
  aiMetadata: {
    description:
      'Fires when a new Pin is added to a specific board (selected by board_id), emitting the Pin record. Polls that board for Pins created since the last check, optionally filtered by creative type (regular, video, shopping, carousel, idea).',
  },
  props: {
    board_id: boardIdDropdown,
    ad_account_id: adAccountIdDropdown,
    creative_types: Property.StaticMultiSelectDropdown({
      displayName: 'Pin Types to Watch',
      required: false,
      options: {
        options: [
          { label: 'Regular Pins', value: 'REGULAR' },
          { label: 'Video Pins', value: 'VIDEO' },
          { label: 'Shopping Pins', value: 'SHOPPING' },
          { label: 'Carousel Pins', value: 'CAROUSEL' },
          { label: 'Idea Pins', value: 'IDEA' },
        ],
      },
      description:
        'Filter by specific pin types. Leave empty to watch all types.',
    }),
  },
  // One Pin per event: the polling items() returns `data: item` from
  // GET /boards/{board_id}/pins, not the raw { items, bookmark } envelope.
  sampleData: {
    id: '813744226420795884',
    title: 'Summer Recipe',
    description: 'A refreshing summer dish',
    alt_text: 'Plated summer salad',
    link: 'https://www.activepieces.com/',
    board_id: '1145392186421331995',
    board_section_id: null,
    board_owner: { username: 'sample_username' },
    media: {
      media_type: 'image',
      images: {
        '150x150': { width: 150, height: 150, url: 'https://i.pinimg.com/150x150/0d/f6/f1/0df6f1f0bfe7aaca849c1bbc3607a34b.jpg' },
        '400x300': { width: 400, height: 300, url: 'https://i.pinimg.com/400x300/0d/f6/f1/0df6f1f0bfe7aaca849c1bbc3607a34b.jpg' },
        '600x': { width: 600, height: 600, url: 'https://i.pinimg.com/564x/0d/f6/f1/0df6f1f0bfe7aaca849c1bbc3607a34b.jpg' },
        '1200x': { width: 1200, height: 1200, url: 'https://i.pinimg.com/1200x/0d/f6/f1/0df6f1f0bfe7aaca849c1bbc3607a34b.jpg' },
      },
    },
    dominant_color: '#6E7874',
    creative_type: 'REGULAR',
    parent_pin_id: null,
    product_tags: [],
    pin_metrics: null,
    is_owner: true,
    is_standard: true,
    is_product: false,
    is_removable: false,
    has_been_promoted: false,
    created_at: '2020-01-01T20:10:40',
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
