import { createAction, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const findRecordsByIdAction = createAction({
  auth: BikaAuth,
  name: 'find_records_by_id',
  classification: 'SEARCH',
  displayName: 'Find Records (by ID)',
  description: 'Searches the records of a database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches records of a Bika.ai database, given its space and database IDs, with an optional filter in the Bika filter query language (field==value, field names with spaces in {}, ; for AND or , for OR but never both, dates compared by day), optional sort and field list. Returns up to Limit records (default 20, max 100) with has_more and next_offset for paging; sorted results cannot be paged, so with a sort raise Limit or narrow the filter instead. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
    database_id: bikaProps.databaseIdText(),
    filter: Property.LongText({
      displayName: 'Filter',
      description: 'For example {Stage}=="Close Deals";Score>10. Leave empty to list all records.',
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Field names to return. Leave empty to return all fields.',
      required: false,
    }),
    sort_field: Property.ShortText({
      displayName: 'Sort Field',
      description: 'A field name to sort by. Sorted results come back in one page only (no Offset).',
      required: false,
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many records to return (1 to 100, default 20).',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.ShortText({
      displayName: 'Offset',
      description: 'The next_offset from a previous call, to get the next page.',
      required: false,
    }),
  },
  outputSchema: bikaOutputSchemas.agentFind,
  async run(context) {
    const props = context.propsValue;
    return bikaOperations.agentFind({
      auth: context.auth,
      spaceId: props.space_id,
      databaseId: props.database_id,
      filter: props.filter,
      fields: props.fields,
      sortField: props.sort_field,
      sortOrder: props.sort_order,
      limit: props.limit,
      offset: props.offset,
    });
  },
});
