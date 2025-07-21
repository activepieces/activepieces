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
import { getPages } from '../common';
import { notionAuth } from '../..';

export const updatedPage = createTrigger({
  auth: notionAuth,
  name: 'updated_page',
  displayName: 'Updated Page',
  description:
    'Triggers whenever any page in your Notion workspace is modified or updated. Ideal for syncing content changes, backup processes, or notifying teams about documentation updates.',
  props: {},
  sampleData: {
    object: 'page',
    id: '1d4805e9-774b-8056-820b-c1083bff77e3',
    created_time: '2025-04-13T23:35:00.000Z',
    last_edited_time: '2025-07-01T07:29:00.000Z',
    created_by: {
      object: 'user',
      id: '0f46d5cf-06ee-4350-8051-79ad10c898a6',
    },
    last_edited_by: {
      object: 'user',
      id: '0f46d5cf-06ee-4350-8051-79ad10c898a6',
    },
    cover: null,
    icon: {
      type: 'emoji',
      emoji: '💰',
    },
    parent: {
      type: 'workspace',
      workspace: true,
    },
    archived: false,
    in_trash: false,
    properties: {
      title: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'Saas Ideas',
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
            plain_text: 'Saas Ideas',
            href: null,
          },
        ],
      },
    },
    url: 'https://www.notion.so/Saas-Ideas-1d4805e9774b8056820bc1083bff77e3',
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
  items: async ({ auth, lastItemId }) => {
    const lastItem = lastItemId as string;
    let lastEditedDate: Date | undefined;

    if (lastItem) {
      const lastUpdatedEpochMS = Number(lastItem.split('|')[1]);
      lastEditedDate = dayjs(lastUpdatedEpochMS).toDate();
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
  startDate?: Date
) => {
  const searchOptions = startDate ? { editedAfter: startDate } : undefined;
  const sortOptions = {
    property: 'last_edited_time',
    direction: 'descending' as const,
  };

  const pages = await getPages(authentication, searchOptions, sortOptions);
  return pages;
};
