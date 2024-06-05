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
import { notionCommon } from '../common';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { isNil } from 'lodash';

export const newDatabaseItem = createTrigger({
  auth: notionAuth,
  name: 'new_database_item',
  displayName: 'New Database Item',
  description: 'Triggers when an item is added to a database.',
  props: {
    database_id: notionCommon.database_id,
  },
  sampleData: {
    id: 'd23872cd-c106-4afa-b33d-d3fd66064ccb',
    url: 'https://www.notion.so/Take-Fig-on-a-walk-d23872cdc1064afab33dd3fd66064ccb',
    icon: {
      type: 'emoji',
      emoji: '🐶',
    },
    cover: null,
    object: 'page',
    parent: {
      type: 'database_id',
      database_id: 'fe1eb968-50b6-4d96-83ca-4d19b96f488e',
    },
    archived: false,
    created_by: {
      id: 'f3806fae-a281-4f4e-8563-c816c3e8bd40',
      object: 'user',
    },
    properties: {
      Name: {
        id: 'title',
        type: 'title',
        title: [
          {
            href: null,
            text: {
              link: null,
              content: 'Take Fig on a walk',
            },
            type: 'text',
            plain_text: 'Take Fig on a walk',
            annotations: {
              bold: false,
              code: false,
              color: 'default',
              italic: false,
              underline: false,
              strikethrough: false,
            },
          },
        ],
      },
      Status: {
        id: '%5EOE%40',
        type: 'select',
        select: {
          id: '2',
          name: 'Doing',
          color: 'yellow',
        },
      },
      'Date Created': {
        id: "'Y6%3C",
        type: 'created_time',
        created_time: '2023-03-02T01:43:00.000Z',
      },
    },
    created_time: '2023-03-02T01:43:00.000Z',
    last_edited_by: {
      id: 'f3806fae-a281-4f4e-8563-c816c3e8bd40',
      object: 'user',
    },
    last_edited_time: '2023-03-02T01:43:00.000Z',
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
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
    });
  },
});

const polling: Polling<
  OAuth2PropertyValue,
  { database_id: string | undefined }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const lastItem = lastItemId as string;
    let lastCreatedDate: string | null;

    if (lastItem) {
      const lastUpdatedEpochMS = Number(lastItem.split('|')[1]);
      lastCreatedDate = dayjs(lastUpdatedEpochMS).toISOString();
    } else {
      lastCreatedDate = lastItem;
    }

    const items = await getResponse(
      auth,
      propsValue.database_id!,
      lastCreatedDate
    );
    return items.map((item: any) => {
      const object = item as { created_time: string; id: string };
      return {
        id: object.id + '|' + dayjs(object.created_time).valueOf(),
        data: item,
      };
    });
  },
};

const getResponse = async (
  authentication: OAuth2PropertyValue,
  database_id: string,
  startDate: string | null
) => {
  const notion = new Client({
    auth: authentication.access_token,
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
              timestamp: 'created_time',
              created_time: {
                on_or_after: startDate,
              },
            },
      sorts: [
        {
          timestamp: 'created_time',
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
