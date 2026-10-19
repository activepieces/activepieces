import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { getBoardActivityLogsActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const getBoardActivityLogsAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_board_activity_logs',
  classification: 'SEARCH',
  displayName: 'Get Board Activity Logs',
  description: 'Gets the activity log of a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the activity log of a monday.com board: who changed what and when (column value changes, item creation, moves, deletes). Narrow by time range, users, items, groups or columns. Use to audit recent changes; to read comments use List Item Updates. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getBoardActivityLogsActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    from: Property.DateTime({
      displayName: 'From',
      description: 'Only logs at or after this time (ISO 8601).',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To',
      description: 'Only logs at or before this time (ISO 8601).',
      required: false,
    }),
    item_ids: Property.Array({
      displayName: 'Item IDs',
      required: false,
    }),
    user_ids: Property.Array({
      displayName: 'User IDs',
      required: false,
    }),
    group_ids: Property.Array({
      displayName: 'Group IDs',
      required: false,
    }),
    column_ids: Property.Array({
      displayName: 'Column IDs',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Logs per page (default 25).',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { board_id, from, to, limit, page } = context.propsValue;
    const itemIds = mondayApi.toStringArray(context.propsValue.item_ids);
    const userIds = mondayApi.toStringArray(context.propsValue.user_ids);
    const groupIds = mondayApi.toStringArray(context.propsValue.group_ids);
    const columnIds = mondayApi.toStringArray(context.propsValue.column_ids);

    const data = await makeClient(context.auth).query<{ boards: { activity_logs: MondayActivityLog[] | null }[] }>({
      query: `query ($board_id: [ID!], $from: ISO8601DateTime, $to: ISO8601DateTime, $item_ids: [ID!], $user_ids: [ID!], $group_ids: [String], $column_ids: [String], $limit: Int, $page: Int) {
        boards(ids: $board_id) {
          activity_logs(from: $from, to: $to, item_ids: $item_ids, user_ids: $user_ids, group_ids: $group_ids, column_ids: $column_ids, limit: $limit, page: $page) {
            id
            event
            entity
            user_id
            account_id
            created_at
            data
          }
        }
      }`,
      variables: {
        board_id: [board_id],
        from: from || undefined,
        to: to || undefined,
        item_ids: itemIds.length > 0 ? itemIds : undefined,
        user_ids: userIds.length > 0 ? userIds : undefined,
        group_ids: groupIds.length > 0 ? groupIds : undefined,
        column_ids: columnIds.length > 0 ? columnIds : undefined,
        limit: limit ?? 25,
        page: page ?? 1,
      },
    });

    if (data.boards.length === 0) {
      throw new Error(`Board ${board_id} was not found or is not accessible.`);
    }

    const activityLogs = (data.boards[0].activity_logs ?? []).map((log) => ({
      id: log.id,
      event: log.event,
      entity: log.entity,
      user_id: log.user_id,
      account_id: log.account_id,
      created_at: toIsoDate(log.created_at),
      data: log.data,
    }));

    return { activity_logs: activityLogs, count: activityLogs.length };
  },
});

function toIsoDate(value: string): string {
  const ticks = Number(value);
  return Number.isFinite(ticks) ? new Date(Math.floor(ticks / 10000)).toISOString() : value;
}

type MondayActivityLog = {
  id: string;
  event: string;
  entity: string;
  user_id: string;
  account_id: string;
  created_at: string;
  data: string;
};
