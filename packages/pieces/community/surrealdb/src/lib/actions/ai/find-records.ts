import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbFindRecordsOutputSchema } from '../../output-schemas';

export const findRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_find_records',
  outputSchema: surrealdbFindRecordsOutputSchema,
  displayName: 'Find Records',
  description: 'Finds records in a table using filters, sorting and paging.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns records of a table matching all the filters, optionally only some fields, sorted by one field, with paging (has_more, next_start). Values are sent as typed variables, never spliced into the query. Use Count Records for totals and Get Record for one id; table names come from List Tables. Read-only.',
    idempotent: true,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
    filters: surrealdbAiProps.filters({ required: false }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Fields to return, e.g. ["id", "name", "address.city"]. Leave empty for all fields.',
      required: false,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By',
      description: 'Field to sort by, e.g. "created_at" or "address.city". Leave empty for no particular order.',
      required: false,
    }),
    orderDirection: Property.StaticDropdown({
      displayName: 'Order Direction',
      description: 'ASC or DESC. Defaults to ASC.',
      required: false,
      options: { options: [{ label: 'Ascending', value: 'ASC' }, { label: 'Descending', value: 'DESC' }] },
    }),
    limit: surrealdbAiProps.limit({ required: false }),
    start: Property.Number({
      displayName: 'Start',
      description: 'Number of records to skip, for paging. Use next_start from the previous call with the same filters and order.',
      required: false,
    }),
  },
  async run(context) {
    const { table, filters, fields, orderBy, orderDirection, limit, start } = context.propsValue;
    const max = surrealdbUtils.boundedInteger({ value: limit, defaultValue: surrealdbAiProps.DEFAULT_LIMIT, min: 1, max: surrealdbAiProps.MAX_LIMIT, label: 'Limit' });
    const skip = surrealdbUtils.boundedInteger({ value: start, defaultValue: 0, min: 0, max: Number.MAX_SAFE_INTEGER, label: 'Start' });
    if (orderDirection !== undefined && orderDirection !== 'ASC' && orderDirection !== 'DESC') {
      throw new Error('Order Direction must be ASC or DESC.');
    }
    const where = surrealdbUtils.buildWhere({ filters });
    const selected = (fields ?? []).map(String);
    const projection = selected.length > 0 ? 'type::fields($fields)' : '*';
    const order = orderBy ? ` ORDER BY ${surrealdbUtils.fieldPath({ field: orderBy, label: 'Order By' })} ${orderDirection ?? 'ASC'}` : '';
    const found = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: `SELECT ${projection} FROM type::table($table)${where.clause}${order} LIMIT $limit START $start;`,
      vars: { ...where.vars, table, fields: selected, limit: max + 1, start: skip },
    });
    const hasMore = found.length > max;
    const records = found.slice(0, max);
    return { records, count: records.length, has_more: hasMore, next_start: hasMore ? skip + max : null };
  },
});
