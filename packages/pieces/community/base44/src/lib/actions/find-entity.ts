import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const findEntity = createAction({
  auth: base44Auth,
  name: 'find_entity',
  classification: 'SEARCH',
  displayName: 'Find Entity Record',
  description: 'Find a matching entity record in your Base44 app',
  audience: 'both',
  outputSchema: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'results', label: 'Results', labelKey: 'id', listItems: base44Common.recordFields },
    ],
  },
  aiMetadata: { description: 'Searches a Base44 app for records of a given entity type that match a JSON filter query (exact field values, or operators such as $in, $gt, $regex), returning up to "limit" matches (default 50, max 500). Use when you need to look up existing records by field values (e.g. find a User by email) without modifying anything. Requires the exact entity-type name. Read-only and idempotent. Returned records include the built-in fields plus every app-defined field of the entity (e.g. name, status) as top-level keys.', idempotent: true },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    searchQuery: Property.Json({
      displayName: 'Search Query',
      description: 'Query to find the entity (e.g. {"email": "john@example.com"})',
      required: true,
      defaultValue: {},
    }),
    sort: Property.ShortText({
      displayName: 'Sort',
      description: 'Field to sort by. Prefix with "-" for descending (e.g. "-created_date").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (1-500). Defaults to 50.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType, searchQuery, sort, limit } = propsValue;
    const query = base44Common.requireJsonObject({ value: searchQuery, label: 'Search Query' });
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      const results = base44Common.toRecordList(
        await handler.filter(
          query,
          base44Common.toSortField(sort),
          base44Common.clampLimit({ limit, fallback: base44Common.DEFAULT_LIMIT }),
        ),
      );
      return {
        found: results.length > 0,
        count: results.length,
        results,
      };
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'search records' });
    }
  },
});
