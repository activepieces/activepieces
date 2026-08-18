import {
  createTrigger,
  TriggerStrategy,
  Property,
  OAuth2PropertyValue,
  Store,
  isNil,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { adAccountIdDropdown, boardIdDropdown } from '../common/props';
import { newPinOnBoardTriggerOutputSchema } from '../output-schemas';

const PAGE_SIZE = 100; // Pinterest's documented max is 250.

// Bounds the requests one poll can make; a larger backlog drains across polls.
const MAX_PAGES_PER_POLL = 10;
const MAX_SAMPLE_PAGES = 10;

const LAST_POLL_KEY = 'lastPoll';
const PENDING_BOOKMARK_KEY = 'pendingBookmark';
const PENDING_MAX_EPOCH_KEY = 'pendingMaxEpoch';

type PinsPage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  bookmark?: string;
};

type SweepProps = {
  board_id: string;
  ad_account_id?: string;
  creative_types?: string[];
};

async function fetchPage(
  accessToken: string,
  { board_id, ad_account_id, creative_types }: SweepProps,
  bookmark: string | undefined
): Promise<PinsPage> {
  const searchParams = new URLSearchParams();
  searchParams.append('page_size', PAGE_SIZE.toString());
  if (bookmark) {
    searchParams.append('bookmark', bookmark);
  }
  if (ad_account_id) {
    searchParams.append('ad_account_id', ad_account_id);
  }
  if (creative_types && creative_types.length > 0) {
    creative_types.forEach((type) => {
      searchParams.append('creative_types', type);
    });
  }

  const response = await makeRequest(
    accessToken,
    HttpMethod.GET,
    `/boards/${board_id}/pins?${searchParams.toString()}`
  );
  return { items: response.items || [], bookmark: response.bookmark };
}

type SweepResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pins: any[];
  maxEpoch: number;
  /** Reached the checkpoint or ran out of bookmark, so nothing older is unread. */
  complete: boolean;
  nextBookmark?: string;
};

// Assumes GET /boards/{id}/pins returns newest-first, matching observed
// behaviour; Pinterest's API reference does not document a sort order.
async function sweep(
  accessToken: string,
  props: SweepProps,
  lastPoll: number,
  startBookmark: string | undefined,
  carriedMaxEpoch: number
): Promise<SweepResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pins: any[] = [];
  let maxEpoch = carriedMaxEpoch;
  let bookmark = startBookmark;
  let pageCount = 0;

  for (;;) {
    const page = await fetchPage(accessToken, props, bookmark);
    pageCount++;
    bookmark = page.bookmark;

    for (const item of page.items) {
      const epoch = dayjs(item.created_at).valueOf();
      maxEpoch = Math.max(maxEpoch, epoch);
      if (epoch > lastPoll) {
        pins.push(item);
      }
    }

    // Everything past this point is already seen, whatever the bookmark says.
    const reachedCheckpoint = page.items.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => dayjs(item.created_at).valueOf() <= lastPoll
    );
    if (reachedCheckpoint || isNil(bookmark)) {
      return { pins, maxEpoch, complete: true };
    }

    if (pageCount >= MAX_PAGES_PER_POLL) {
      return { pins, maxEpoch, complete: false, nextBookmark: bookmark };
    }

    // Rate limiting awareness
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function readCheckpoint(store: Store): Promise<number> {
  const stored = await store.get<number>(LAST_POLL_KEY);
  if (!isNil(stored)) {
    return stored;
  }
  // onEnable seeds this; fall back to watching from now rather than failing.
  const now = Date.now();
  await store.put(LAST_POLL_KEY, now);
  return now;
}

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
    const accessToken = getAccessTokenOrThrow(
      context.auth as OAuth2PropertyValue
    );
    const props = context.propsValue as SweepProps;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pins: any[] = [];
    let bookmark: string | undefined = undefined;
    let pageCount = 0;

    do {
      const page = await fetchPage(accessToken, props, bookmark);
      pins.push(...page.items);
      bookmark = page.bookmark;
      pageCount++;
    } while (bookmark && pageCount < MAX_SAMPLE_PAGES && pins.length < 5);

    return pins
      .sort(
        (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
      )
      .slice(0, 5);
  },
  async onEnable(context) {
    await context.store.put(LAST_POLL_KEY, Date.now());
    await context.store.delete(PENDING_BOOKMARK_KEY);
    await context.store.delete(PENDING_MAX_EPOCH_KEY);
  },
  async onDisable(context) {
    await context.store.delete(PENDING_BOOKMARK_KEY);
    await context.store.delete(PENDING_MAX_EPOCH_KEY);
  },
  async run(context) {
    const { store } = context;
    const accessToken = getAccessTokenOrThrow(
      context.auth as OAuth2PropertyValue
    );
    const props = context.propsValue as SweepProps;

    const lastPoll = await readCheckpoint(store);
    const pendingBookmark = await store.get<string>(PENDING_BOOKMARK_KEY);
    const carriedMaxEpoch =
      (await store.get<number>(PENDING_MAX_EPOCH_KEY)) ?? lastPoll;

    let result: SweepResult;
    try {
      result = await sweep(
        accessToken,
        props,
        lastPoll,
        pendingBookmark ?? undefined,
        carriedMaxEpoch
      );
    } catch (error) {
      // A resume bookmark can expire between polls; retry from the newest page.
      // Safe because the checkpoint has not moved. Anything else propagates.
      if (isNil(pendingBookmark)) {
        throw error;
      }
      await store.delete(PENDING_BOOKMARK_KEY);
      await store.delete(PENDING_MAX_EPOCH_KEY);
      result = await sweep(accessToken, props, lastPoll, undefined, lastPoll);
    }

    if (result.complete) {
      await store.put(LAST_POLL_KEY, Math.max(lastPoll, result.maxEpoch));
      await store.delete(PENDING_BOOKMARK_KEY);
      await store.delete(PENDING_MAX_EPOCH_KEY);
    } else {
      // Checkpoint stays put: older pins may still qualify, and advancing now
      // would leave them permanently behind it. Next poll resumes here.
      await store.put(PENDING_BOOKMARK_KEY, result.nextBookmark);
      await store.put(PENDING_MAX_EPOCH_KEY, result.maxEpoch);
    }

    return result.pins.sort(
      (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
    );
  },
});
