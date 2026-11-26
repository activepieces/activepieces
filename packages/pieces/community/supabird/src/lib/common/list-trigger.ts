import {
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { supabirdAuth } from '../auth';
import { SupabirdPage, supabirdRequest } from './client';
import { socialSetDropdown } from './props';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGES = 3;

const triggerProps = {
  socialSet: socialSetDropdown,
};

type ListTriggerConfig = {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  /** Path of the list endpoint, for example /posts/scheduled. */
  path: string;
  /** Extra fixed query parameters, for example source=ideas_lab. */
  query?: Record<string, string>;
  /** Items per request. The API allows up to 25 for published posts and 50 elsewhere. */
  pageSize?: number;
  /** ISO timestamps to try in order; the first one present is the item time. */
  timeFields: string[];
  sampleData: unknown;
};

function itemEpoch(
  item: Record<string, unknown>,
  timeFields: string[]
): number | null {
  for (const field of timeFields) {
    const value = item[field];
    if (typeof value === 'string') {
      const epoch = Date.parse(value);
      if (!Number.isNaN(epoch)) {
        return epoch;
      }
    }
  }
  return null;
}

/**
 * SupaBird has no webhooks, so the triggers poll the newest-first list
 * endpoints. Items are deduplicated by time rather than by "last seen id":
 * scheduled posts and drafts leave their lists when they are published,
 * unscheduled or scheduled, and a missing last-seen item would make an
 * id-based dedupe replay the whole page.
 */
export function createSupabirdListTrigger(config: ListTriggerConfig) {
  const polling: Polling<
    AppConnectionValueForAuthProperty<typeof supabirdAuth>,
    StaticPropsValue<typeof triggerProps>
  > = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      // Test runs (lastFetchEpochMS is 0) only need the first page.
      const maxPages = lastFetchEpochMS === 0 ? 1 : MAX_PAGES;
      const items: { epochMilliSeconds: number; data: unknown }[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < maxPages; page++) {
        const queryParams: Record<string, string> = {
          ...config.query,
          limit: String(config.pageSize ?? DEFAULT_PAGE_SIZE),
        };
        if (propsValue.socialSet) {
          queryParams['social_set'] = propsValue.socialSet;
        }
        if (cursor) {
          queryParams['cursor'] = cursor;
        }
        const { body } = await supabirdRequest<
          SupabirdPage<Record<string, unknown>>
        >({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: config.path,
          queryParams,
        });
        for (const item of body.data ?? []) {
          const epoch = itemEpoch(item, config.timeFields);
          if (epoch !== null) {
            items.push({ epochMilliSeconds: epoch, data: item });
          }
        }
        if (!body.has_more || !body.next_cursor) {
          break;
        }
        cursor = body.next_cursor;
      }
      return items;
    },
  };

  return createTrigger({
    auth: supabirdAuth,
    name: config.name,
    classification: 'READ',
    displayName: config.displayName,
    description: config.description,
    aiMetadata: { description: config.aiDescription },
    props: triggerProps,
    sampleData: config.sampleData,
    type: TriggerStrategy.POLLING,
    async test(context) {
      return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
      await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
      await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
      return await pollingHelper.poll(polling, context);
    },
  });
}
