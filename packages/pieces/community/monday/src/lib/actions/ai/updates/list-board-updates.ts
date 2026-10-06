import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { listBoardUpdatesActionOutputSchema } from '../../../output-schemas';

export const listBoardUpdatesAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_board_updates',
  classification: 'SEARCH',
  displayName: 'List Board Updates',
  description: 'Lists updates across all items of a board, optionally within a date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List updates (comments) posted across a whole monday.com board, optionally limited to a date range, each tagged with its item ID. Use for board-wide activity digests; for one item\'s conversation with replies use List Item Updates. Updates posted in the last ~30 seconds may not appear yet. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listBoardUpdatesActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    from_date: Property.ShortText({
      displayName: 'From Date',
      description: 'Only updates created on or after this ISO 8601 date-time (e.g. 2026-09-01T00:00:00Z).',
      required: false,
    }),
    to_date: Property.ShortText({
      displayName: 'To Date',
      description: 'Only updates created on or before this ISO 8601 date-time (e.g. 2026-09-30T23:59:59Z).',
      required: false,
    }),
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
    const { board_id, from_date, to_date, limit, page } = context.propsValue;

    const data = await makeClient(context.auth).query<{ boards: { id: string; updates: MondayUpdate[] | null }[] }>({
      query: `query ($ids: [ID!], $limit: Int, $page: Int, $fromDate: ISO8601DateTime, $toDate: ISO8601DateTime) {
        boards(ids: $ids) {
          id
          updates(limit: $limit, page: $page, from_date: $fromDate, to_date: $toDate) {
            id
            body
            text_body
            item_id
            creator_id
            creator { name }
            created_at
            updated_at
          }
        }
      }`,
      variables: {
        ids: [board_id],
        limit: limit ?? 25,
        page: page ?? 1,
        ...(isNil(from_date) ? {} : { fromDate: from_date }),
        ...(isNil(to_date) ? {} : { toDate: to_date }),
      },
    });

    const board = data.boards[0];
    if (!board) {
      throw new Error(`Board ${board_id} was not found or is not accessible.`);
    }

    const updates = (board.updates ?? []).map((update) => ({
      id: update.id,
      board_id: board.id,
      item_id: update.item_id ?? null,
      body: update.body,
      text_body: update.text_body ?? null,
      creator_id: update.creator_id ?? null,
      creator_name: update.creator?.name ?? null,
      created_at: update.created_at ?? null,
      updated_at: update.updated_at ?? null,
    }));

    return { updates, count: updates.length };
  },
});

type MondayUpdate = {
  id: string;
  body: string;
  text_body: string | null;
  item_id: string | null;
  creator_id: string | null;
  creator: { name: string } | null;
  created_at: string | null;
  updated_at: string | null;
};
