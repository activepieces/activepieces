import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const findRecordsAction = createAction({
  auth: BikaAuth,
  name: 'bika_find_records',
  classification: 'SEARCH',
  displayName: 'Find Records',
  description: 'Finds records in a Bika database, with an optional filter.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists records of a Bika.ai database picked from dropdowns, optionally narrowed by a filter in the Bika filter query language, following pages up to Max Records (default 100, at most 1,000). Returns hasMore and an offset to continue. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    filter: Property.LongText({
      displayName: 'Filter',
      description: 'Leave empty to match every record.',
      placeholder: '{Stage}=="Close Deals";{Score}>10',
      required: false,
    }),
    filter_help: Property.MarkDown({
      value:
        'Put field names in {} and join conditions with ; (and) or , (or). [Filter syntax](https://bika.ai/help/guide/developer/filter-query-language)',
      variant: MarkdownVariant.INFO,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'How many records to return. Empty returns 100, at most 1,000.',
      required: false,
      defaultValue: 100,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Records per API request, up to 1,000. Bigger pages use fewer requests.',
      required: false,
      advanced: true,
    }),
    offset: Property.ShortText({
      displayName: 'Offset',
      description: 'Paste the offset a previous search returned to continue from there.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    { key: 'database', display: 'section', label: 'Location', icon: 'inbox', props: ['space_id', 'database_id'] },
    { key: 'search', display: 'section', label: 'Search', icon: 'filter', props: ['filter', 'filter_help', 'maxRecords'] },
  ],
  outputSchema: bikaOutputSchemas.humanFind,
  async run(context) {
    return bikaOperations.humanFind({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      filter: context.propsValue.filter,
      maxRecords: context.propsValue.maxRecords,
      pageSize: context.propsValue.pageSize,
      offset: context.propsValue.offset,
    });
  },
});
