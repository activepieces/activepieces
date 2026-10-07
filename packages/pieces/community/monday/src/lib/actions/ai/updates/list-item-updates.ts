import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { listItemUpdatesActionOutputSchema } from '../../../output-schemas';

export const listItemUpdatesAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_item_updates',
  classification: 'SEARCH',
  displayName: 'List Item Updates',
  description: 'Lists the updates on an item, including their replies.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the updates (comments) posted on one monday.com item, newest first, each with its replies. Use to read an item\'s conversation or to find an Update ID for Edit, Delete, Like, Pin or reply. For updates across a whole board use List Board Updates. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listItemUpdatesActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(true),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Updates per page (default 25, max 100).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
  },
  async run(context) {
    const { item_id, limit, page } = context.propsValue;

    const data = await makeClient(context.auth).query<{ items: { id: string; updates: MondayUpdate[] | null }[] }>({
      query: `query ($ids: [ID!], $limit: Int, $page: Int) {
        items(ids: $ids) {
          id
          updates(limit: $limit, page: $page) {
            id
            body
            text_body
            creator_id
            creator { name }
            created_at
            updated_at
            replies { id body text_body creator_id created_at }
          }
        }
      }`,
      variables: { ids: [item_id], limit: limit ?? 25, page: page ?? 1 },
    });

    const item = data.items[0];
    if (!item) {
      throw new Error(`Item ${item_id} was not found or is not accessible.`);
    }

    const updates = (item.updates ?? []).map((update) => ({
      id: update.id,
      item_id: item.id,
      body: update.body,
      text_body: update.text_body ?? null,
      creator_id: update.creator_id ?? null,
      creator_name: update.creator?.name ?? null,
      created_at: update.created_at ?? null,
      updated_at: update.updated_at ?? null,
      reply_count: (update.replies ?? []).length,
      replies: (update.replies ?? []).map((reply) => ({
        id: reply.id,
        body: reply.body,
        text_body: reply.text_body ?? null,
        creator_id: reply.creator_id ?? null,
        created_at: reply.created_at ?? null,
      })),
    }));

    return { updates, count: updates.length };
  },
});

type MondayUpdate = {
  id: string;
  body: string;
  text_body: string | null;
  creator_id: string | null;
  creator: { name: string } | null;
  created_at: string | null;
  updated_at: string | null;
  replies: {
    id: string;
    body: string;
    text_body: string | null;
    creator_id: string | null;
    created_at: string | null;
  }[] | null;
};
