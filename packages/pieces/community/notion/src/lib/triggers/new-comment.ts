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

export const newComment = createTrigger({
  auth: notionAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description:
    'Triggers whenever someone adds a new comment to a specific Notion page. Perfect for notifications, review workflows, or automated responses to team feedback.',
  props: {
    page_id: notionCommon.page,
  },
  sampleData: {
    object: 'comment',
    id: '223805e9-774b-80b1-9194-001d0c8f56dd',
    parent: {
      type: 'page_id',
      page_id: '1d5805e9-774b-8071-80c0-ffcea9b13b94',
    },
    discussion_id: 'f1c805e9-774b-824f-8511-83edf6abbdda',
    created_time: '2025-07-01T07:19:00.000Z',
    last_edited_time: '2025-07-01T07:19:00.000Z',
    created_by: {
      object: 'user',
      id: '0f46d5cf-06ee-4350-8051-79ad10c898a6',
    },
    rich_text: [
      {
        type: 'text',
        text: {
          content: 'Good DX',
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
        plain_text: 'Good DX',
        href: null,
      },
    ],
    display_name: {
      type: 'integration',
      resolved_name: 'Activepieces',
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

const polling: Polling<OAuth2PropertyValue, { page_id: string | undefined }> = {
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

    const items = await getComments(
      auth,
      propsValue.page_id || '',
      lastCreatedDate
    );
    return items.map((item) => {
      const comment = item as { created_time: string; id: string };
      return {
        id: comment.id + '|' + dayjs(comment.created_time).valueOf(),
        data: item,
      };
    });
  },
};

const getComments = async (
  authentication: OAuth2PropertyValue,
  page_id: string,
  startDate: string | null
) => {
  const notion = new Client({
    auth: authentication.access_token,
    notionVersion: '2022-02-22',
  });

  let cursor;
  let hasMore = true;
  let shouldContinue = true;

  const results = [];

  do {
    try {
      const response = await notion.comments.list({
        start_cursor: cursor,
        block_id: page_id,
      });

      hasMore = response.has_more;
      cursor = response.next_cursor ?? undefined;

      for (const comment of response.results) {
        if (
          startDate &&
          !dayjs(comment.created_time).isAfter(dayjs(startDate))
        ) {
          shouldContinue = false;
          break;
        }
        results.push(comment);
      }
    } catch (error) {
      if ((error as Error).message?.includes('permissions')) {
        throw new Error(
          'Integration lacks required "read comments" capability.'
        );
      }
      throw error;
    }
  } while (hasMore && shouldContinue);

  return results.sort(
    (a: { created_time: string }, b: { created_time: string }) =>
      dayjs(b.created_time).valueOf() - dayjs(a.created_time).valueOf()
  );
};
