import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const listEntityRecords = createAction({
  auth: base44Auth,
  name: 'list_entity_records',
  classification: 'SEARCH',
  displayName: 'List Entity Records',
  description: 'Lists records of an entity type with sorting and paging',
  audience: 'both',
  outputSchema: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'records', label: 'Records', labelKey: 'id', listItems: base44Common.recordFields },
    ],
  },
  aiMetadata: { description: 'Lists records of a given entity type in a Base44 app, optionally sorted (e.g. "-created_date" for newest first), returning up to "limit" records (default 50, max 500) after skipping "skip" records for paging. Use to discover record IDs or browse data when no filter is known; use Find Entity Record to filter by field values. Read-only and idempotent. Returned records include the built-in fields plus every app-defined field of the entity (e.g. name, status) as top-level keys.', idempotent: true },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
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
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of records to skip, for paging. Defaults to 0.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType, sort, limit, skip } = propsValue;
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      const records = base44Common.toRecordList(
        await handler.list(
          base44Common.toSortField(sort),
          base44Common.clampLimit({ limit, fallback: base44Common.DEFAULT_LIMIT }),
          base44Common.clampSkip(skip),
        ),
      );
      return { count: records.length, records };
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'list records' });
    }
  },
});
