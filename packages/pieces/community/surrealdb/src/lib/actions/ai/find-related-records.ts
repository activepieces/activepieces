import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbFindRelatedRecordsOutputSchema } from '../../output-schemas';

export const findRelatedRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_find_related_records',
  outputSchema: surrealdbFindRelatedRecordsOutputSchema,
  displayName: 'Find Related Records',
  description: 'Finds the records linked to a record through an edge table.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns the edges of one edge table that start at (outgoing), end at (incoming) or touch (both) a record, each with the record on the other side in "related", with paging (has_more, next_start). Edges are created by Relate Records; edge table names come from List Tables. Read-only.',
    idempotent: true,
  },
  props: {
    recordId: surrealdbAiProps.recordId({ required: true }),
    edge: Property.ShortText({
      displayName: 'Edge Table',
      description: 'Name of the edge table, e.g. "knows".',
      required: true,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'outgoing: edges from this record; incoming: edges to it; both. Defaults to outgoing.',
      required: false,
      options: {
        options: [
          { label: 'Outgoing', value: 'outgoing' },
          { label: 'Incoming', value: 'incoming' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    limit: surrealdbAiProps.limit({ required: false }),
    start: Property.Number({
      displayName: 'Start',
      description: 'Number of edges to skip, for paging. Use next_start from the previous call.',
      required: false,
    }),
  },
  async run(context) {
    const { recordId, edge, direction, limit, start } = context.propsValue;
    const match = MATCH_BY_DIRECTION[direction ?? 'outgoing'];
    if (match === undefined) {
      throw new Error('Direction must be outgoing, incoming or both.');
    }
    const max = surrealdbUtils.boundedInteger({ value: limit, defaultValue: surrealdbAiProps.DEFAULT_LIMIT, min: 1, max: surrealdbAiProps.MAX_LIMIT, label: 'Limit' });
    const skip = surrealdbUtils.boundedInteger({ value: start, defaultValue: 0, min: 0, max: Number.MAX_SAFE_INTEGER, label: 'Start' });
    const found = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: `LET $record = type::record($record_id); SELECT *, (IF in = $record { out } ELSE { in }).* AS related FROM type::table($edge) WHERE ${match} LIMIT $limit START $start;`,
      vars: { record_id: recordId, edge, limit: max + 1, start: skip },
    });
    const hasMore = found.length > max;
    const edges = found.slice(0, max);
    return { edges, count: edges.length, has_more: hasMore, next_start: hasMore ? skip + max : null };
  },
});

const MATCH_BY_DIRECTION: Record<string, string | undefined> = {
  outgoing: 'in = $record',
  incoming: 'out = $record',
  both: 'in = $record OR out = $record',
};
