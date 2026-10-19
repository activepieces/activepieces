import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { getNotionToken, NotionAuthValue, notionCommon } from '../common';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { isNil } from '@activepieces/pieces-framework';
import { updatedDatabaseItemTriggerOutputSchema } from '../output-schemas';
import { enrichPage } from '../common/enrich-page';

export const updatedDatabaseItem = createTrigger({
  auth: notionAuth,
  name: 'updated_database_item',
  classification: 'READ',
  displayName: 'Updated Database Item',
  description: 'Triggers when an item is updated in a database.',
  aiMetadata: {
    description:
      'Fires when an existing item in the selected Notion database is edited (any property change), emitting the updated page. Use to react to record changes such as status or field updates in a specific database.',
  },
  props: {
    database_id: notionCommon.database_id,
  },
  outputSchema: updatedDatabaseItemTriggerOutputSchema,
  sampleData: {
    object: 'page',
    id: '1a9fa248-94e2-80a7-aba9-d7200621a1ef',
    title: 'fIX ERROR',
    property_values: {
      Status: 'To Do',
      Priority: 'Medium',
      DueDate: '2025-02-28',
      Name: 'fIX ERROR',
    },
    url: 'https://app.notion.com/p/fIX-ERROR-1a9fa24894e280a7aba9d7200621a1ef',
    public_url: null,
    created_time: '2025-03-01T13:33:00.000Z',
    last_edited_time: '2025-03-01T13:33:00.000Z',
    created_by: {
      object: 'user',
      id: 'eb85488e-97f8-46d2-85fa-49b87bc1037d',
    },
    last_edited_by: {
      object: 'user',
      id: 'eb85488e-97f8-46d2-85fa-49b87bc1037d',
    },
    cover: null,
    icon: null,
    parent: {
      type: 'database_id',
      database_id: '1a9fa248-94e2-81bc-837e-d26e876ba6c0',
    },
    in_trash: false,
    is_archived: false,
    is_locked: false,
    archived: false,
    properties: {
      Status: {
        id: 'H%40%5Bv',
        type: 'select',
        select: {
          id: 'ff441c13-5498-4922-b7b1-0530e7381857',
          name: 'To Do',
          color: 'red',
        },
      },
      Priority: {
        id: 'H%7C%7D%3F',
        type: 'select',
        select: {
          id: 'fd99439b-915e-4cf4-9e1d-39108768e3da',
          name: 'Medium',
          color: 'yellow',
        },
      },
      DueDate: {
        id: 'XsW%7C',
        type: 'date',
        date: {
          start: '2025-02-28',
          end: null,
          time_zone: null,
        },
      },
      Name: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'fIX ERROR ',
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
            plain_text: 'fIX ERROR ',
            href: null,
          },
        ],
      },
    },
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

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof notionAuth>,
  { database_id: string | undefined }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const lastItem = lastItemId as string;
    let lastUpdatedDate: string | null;

    if (lastItem) {
      const lastUpdatedEpochMS = Number(lastItem.split('|')[1]);
      lastUpdatedDate = dayjs(lastUpdatedEpochMS).toISOString();
    } else {
      lastUpdatedDate = lastItem;
    }

    const items = await getResponse(
      auth,
      propsValue.database_id!,
      lastUpdatedDate
    );

    return items.map((item: any) => {
      const object = item as { last_edited_time: string; id: string };
      return {
        id: object.id + '|' + dayjs(object.last_edited_time).valueOf(),
        data: enrichPage(item),
      };
    });
  },
};

const getResponse = async (
  authentication: NotionAuthValue,
  database_id: string,
  startDate: string | null
) => {
  const notion = new Client({
    auth: getNotionToken(authentication),
    notionVersion: '2022-02-22',
  });

  let cursor;
  let hasMore = true;
  const results = [];
  do {
    const response = await notion.databases.query({
      start_cursor: cursor,
      database_id,
      filter:
        startDate == null
          ? undefined
          : {
              timestamp: 'last_edited_time',
              last_edited_time: {
                on_or_after: startDate,
              },
            },
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
    });

    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;

    results.push(...response.results);
  } while (hasMore && !isNil(startDate));

  return results;
};
