import { createAction, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const findRecordsAction = createAction({
  auth: BikaAuth,
  name: 'bika_find_records',
  classification: 'SEARCH',
  displayName: 'Find Records',
  description: 'Finds records in database.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists records of a Bika.ai database picked from dropdowns, optionally narrowed by a filter in the Bika filter query language, following pages up to Max Records (default 100, at most 1,000). Returns hasMore and an offset to continue. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'How many records to return in total (default 100, at most 1,000).',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many records to fetch per API request (default 100, at most 1,000). Larger pages use fewer of your Bika API requests.',
      required: false,
    }),
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'Only return records that match, for example {Stage}=="Close Deals";{Score}>10. Put field names with spaces in {}, join conditions with ; (and) or , (or). See https://bika.ai/help/guide/developer/filter-query-language.',
      required: false,
    }),
    offset: Property.ShortText({
      displayName: 'Offset',
      description: 'To continue a previous search, paste the offset it returned. Leave empty to start from the first record.',
      required: false,
    }),
  },
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
