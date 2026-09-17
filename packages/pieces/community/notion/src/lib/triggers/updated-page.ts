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
import { getPages, NotionAuthValue } from '../common';
import { notionAuth } from '../auth';
import { updatedPageTriggerOutputSchema } from '../output-schemas';
import { enrichPage } from '../common/enrich-page';

export const updatedPage = createTrigger({
  auth: notionAuth,
  name: 'updated_page',
  classification: 'READ',
  displayName: 'Updated Page',
  description:
    'Triggers whenever any page in your Notion workspace is modified or updated. Ideal for syncing content changes, backup processes, or notifying teams about documentation updates.',
  aiMetadata: {
    description:
      'Fires whenever any page shared with the integration in the Notion workspace is modified, emitting the updated page. Use to track content changes workspace-wide rather than within a single database or page.',
  },
  props: {},
  outputSchema: updatedPageTriggerOutputSchema,
  sampleData: {
    object: 'page',
    id: '1a8fa248-94e2-8120-8ccc-e464193fe999',
    title: 'Notes: Meeting Feb 25, 2025 at 09:28 GMT+03:00',
    property_values: {
      'Last Edited Time': '2026-06-26T15:56:00.000Z',
      'Created By': 'Activepieces',
      Created: '2025-02-28T13:25:00.000Z',
      Type: 'Ad Hoc',
      Participants: 'Jane Doe',
      Name: 'Notes: Meeting Feb 25, 2025 at 09:28 GMT+03:00',
    },
    url: 'https://app.notion.com/p/Notes-Meeting-Feb-25-2025-at-09-28-GMT-03-00-1a8fa24894e281208ccce464193fe999',
    public_url: null,
    created_time: '2025-02-28T13:25:00.000Z',
    last_edited_time: '2026-06-26T15:56:00.000Z',
    created_by: {
      object: 'user',
      id: '1a8fa248-94e2-81d5-9ba3-00274355c726',
    },
    last_edited_by: {
      object: 'user',
      id: '1a8fa248-94e2-81d5-9ba3-00274355c726',
    },
    cover: null,
    icon: null,
    parent: {
      type: 'database_id',
      database_id: '1a8fa248-94e2-80fa-8798-f9c67ea7ba28',
    },
    in_trash: false,
    is_archived: false,
    is_locked: false,
    archived: false,
    properties: {
      'Last Edited Time': {
        id: '0AiB',
        type: 'last_edited_time',
        last_edited_time: '2026-06-26T15:56:00.000Z',
      },
      'Created By': {
        id: 'F%5D)%3F',
        type: 'created_by',
        created_by: {
          object: 'user',
          id: '1a8fa248-94e2-81d5-9ba3-00274355c726',
          name: 'Activepieces',
          avatar_url:
            'https://s3-us-west-2.amazonaws.com/public.notion-static.com/5d61a7cb-299e-46d7-9d21-c8d77b1aab18/256x256logo.svg',
          type: 'bot',
          bot: {},
        },
      },
      Created: {
        id: 'Ird4',
        type: 'created_time',
        created_time: '2025-02-28T13:25:00.000Z',
      },
      Type: {
        id: '_%7B%5C7',
        type: 'select',
        select: {
          id: '1747fcca-8207-42c8-802f-fd43965c016a',
          name: 'Ad Hoc',
          color: 'orange',
        },
      },
      Participants: {
        id: 'b%3AeA',
        type: 'people',
        people: [
          {
            object: 'user',
            id: 'eb85488e-97f8-46d2-85fa-49b87bc1037d',
            name: 'Jane Doe',
            avatar_url: null,
            type: 'person',
            person: {
              email: 'jane@example.com',
              email_verified: true,
            },
          },
        ],
      },
      Name: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'Notes: Meeting Feb 25, 2025 at 09:28 GMT+03:00',
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
            plain_text: 'Notes: Meeting Feb 25, 2025 at 09:28 GMT+03:00',
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
  Record<string, never>
> = {
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
        data: enrichPage(item),
      };
    });
  },
};

const getUpdatedPages = async (
  authentication: NotionAuthValue,
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
