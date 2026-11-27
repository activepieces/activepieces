import {
  createTrigger,
  isNil,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { getNotionToken, NotionAuthValue, notionCommon } from '../common';
import { Client, collectPaginatedAPI, isFullComment } from '@notionhq/client';
import { CommentObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { CheckpointItem, notionCheckpoint } from '../common/checkpoint';
import { notionAuth } from '../auth';
import { newCommentTriggerOutputSchema } from '../output-schemas';

export const newComment = createTrigger({
  auth: notionAuth,
  name: 'new_comment',
  classification: 'READ',
  displayName: 'New Comment',
  description: 'Triggers when a comment is added to a page.',
  aiMetadata: {
    description:
      'Fires when a new comment is posted on the selected Notion page, emitting the comment. Use to react to feedback or discussion activity on a specific page; requires read-comments capability on the integration.',
  },
  props: {
    page_id: notionCommon.page,
  },
  outputSchema: newCommentTriggerOutputSchema,
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
    const comments = await listComments({
      auth: ctx.auth,
      pageId: ctx.propsValue.page_id ?? '',
    });
    return comments.slice(0, SAMPLE_SIZE).map((item) => item.data);
  },
  async onEnable(ctx) {
    await enable({
      auth: ctx.auth,
      store: ctx.store,
      pageId: ctx.propsValue.page_id ?? '',
      isRepublish: ctx.isRepublish,
    });
  },
  async onDisable() {
    return;
  },
  async run(ctx) {
    const pageId = ctx.propsValue.page_id ?? '';
    const checkpoint = await notionCheckpoint.load({ store: ctx.store });
    if (isNil(checkpoint)) {
      await enable({ auth: ctx.auth, store: ctx.store, pageId });
      return [];
    }
    const { fresh, checkpoint: advanced } = notionCheckpoint.advance({
      checkpoint,
      items: await listComments({ auth: ctx.auth, pageId }),
    });
    await notionCheckpoint.save({ store: ctx.store, checkpoint: advanced });
    return fresh.map((item) => item.data);
  },
});

async function enable({
  auth,
  store,
  pageId,
  isRepublish,
}: {
  auth: NotionAuthValue;
  store: Store;
  pageId: string;
  isRepublish?: boolean;
}): Promise<void> {
  await notionCheckpoint.enable({
    store,
    isRepublish,
    fetchLatest: () => listComments({ auth, pageId }),
  });
}

async function listComments({
  auth,
  pageId,
}: {
  auth: NotionAuthValue;
  pageId: string;
}): Promise<CheckpointItem[]> {
  const notion = new Client({
    auth: getNotionToken(auth),
    notionVersion: '2022-02-22',
  });
  try {
    const comments = await collectPaginatedAPI(notion.comments.list, {
      block_id: pageId,
    });
    return comments
      .filter(isFullComment)
      .map(toItem)
      .sort((a, b) => b.time - a.time);
  } catch (error) {
    if (error instanceof Error && error.message.includes('permissions')) {
      throw new Error('Integration lacks required "read comments" capability.');
    }
    throw error;
  }
}

function toItem(comment: CommentObjectResponse): CheckpointItem {
  const id = notionCheckpoint.fingerprint([comment.id]);
  return {
    id,
    version: id,
    time: dayjs(comment.created_time).valueOf(),
    data: comment,
  };
}

const SAMPLE_SIZE = 5;
