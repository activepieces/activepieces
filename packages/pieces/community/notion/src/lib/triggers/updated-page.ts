import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  TriggerStrategy,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';

export const updatedPage = createTrigger({
  auth: notionAuth,
  name: 'updated_page',
  displayName: 'Updated Page',
  description: 'Trigger a sync process when documentation is updated.',
  props: {},
  sampleData: {
    object: 'page',
    id: '59833787-2cf9-4fdf-8782-e53db20768a5',
    created_time: '2022-03-01T19:05:00.000Z',
    last_edited_time: '2022-07-06T20:25:00.000Z',
    created_by: {
      object: 'user',
      id: 'ee5f0f84-409a-440f-983a-a5315961c6e4',
    },
    last_edited_by: {
      object: 'user',
      id: '0c3e9826-b8f7-4f73-927d-2caaf86f1103',
    },
    cover: {
      type: 'external',
      external: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg',
      },
    },
    icon: {
      type: 'emoji',
      emoji: '🥬',
    },
    parent: {
      type: 'database_id',
      database_id: 'd9824bdc-8445-4327-be8b-5b47500af6ce',
    },
    archived: false,
    in_trash: false,
    properties: {
      Name: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'Tuscan kale',
              link: null,
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: 'Tuscan kale',
            href: null,
          },
        ],
      },
    },
    url: 'https://www.notion.so/Tuscan-kale-598337872cf94fdf8782e53db20768a5',
    public_url: null,
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
});

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const lastItem = lastItemId as string;
    let lastEditedDate: string | null;

    if (lastItem) {
      const lastUpdatedEpochMS = Number(lastItem.split('|')[1]);
      lastEditedDate = dayjs(lastUpdatedEpochMS).toISOString();
    } else {
      lastEditedDate = null;
    }

    const items = await getUpdatedPages(auth, lastEditedDate);
    return items.map((item: any) => {
      const page = item as { last_edited_time: string; id: string };
      return {
        id: page.id + '|' + dayjs(page.last_edited_time).valueOf(),
        data: item,
      };
    });
  },
};

const getUpdatedPages = async (
  authentication: OAuth2PropertyValue,
  startDate: string | null
) => {
  const notion = new Client({
    auth: authentication.access_token,
    notionVersion: '2022-02-22',
  });

  try {
    const allPages: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let foundOlderPage = false;

    while (hasMore && !foundOlderPage) {
      const response = await notion.search({
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        start_cursor: cursor,
        page_size: 100,
      });

      // Process pages and stop when finding older ones
      for (const page of response.results) {
        const pageData = page as any;
        if (!pageData || !pageData.last_edited_time) continue;

        const pageDate = dayjs(pageData.last_edited_time);

        if (startDate) {
          const startDateTime = dayjs(startDate);

          // Stop when finding older pages
          if (
            pageDate.isSame(startDateTime) ||
            pageDate.isBefore(startDateTime)
          ) {
            foundOlderPage = true;
            break;
          }
        }

        // Filter out archived and trashed pages
        if (!pageData.archived && !pageData.in_trash) {
          allPages.push({
            ...pageData,
            // Add metadata for better processing
            _processed_at: new Date().toISOString(),
            _is_updated: !startDate || pageDate.isAfter(dayjs(startDate)),
          });
        }
      }

      hasMore = response.has_more;
      cursor = response.next_cursor || undefined;
    }

    // Return only updated pages sorted by last edited time
    return allPages
      .filter((page) => page._is_updated)
      .sort(
        (a: any, b: any) =>
          dayjs(b.last_edited_time).valueOf() -
          dayjs(a.last_edited_time).valueOf()
      );
  } catch (error: any) {
    if (error.message?.includes('capabilities')) {
      throw new Error('Integration lacks required "read content" capability.');
    }
    throw error;
  }
};
