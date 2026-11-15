import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { browseAlgoliaRecords } from '../common/client';
import { algoliaProps } from '../common/props';
import { parseIntegerInRange, parseRequiredString } from '../common/utils';

export const browseRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'browse-records',
  classification: 'SEARCH',
  displayName: 'Browse Records',
  description: 'Retrieves records from an Algolia index.',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves the raw records stored in an Algolia index, paging through them up to an optional limit (at least 1, default 10,000). Use this to dump or inspect index contents; it is a read-only lookup, not a relevance-ranked query, so it does not accept a search term; to find specific records use Search Records instead. The output is the full array of records and can be very large, so keep the limit to what you need (large limits load every record into memory; 10,000 or less recommended). Idempotent.',
    idempotent: true,
  },
  outputSchema: algoliaOutputSchemas.browseRecords,
  props: {
    indexName: algoliaProps.index(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to retrieve (at least 1). Defaults to 10,000. Large limits load every record into memory; keep it to what you need, 10,000 or less recommended.',
      required: false,
      defaultValue: 10_000,
    }),
  },
  async run(context) {
    const indexName = parseRequiredString(context.propsValue.indexName, 'Index');

    return browseAlgoliaRecords({
      auth: context.auth,
      indexName,
      limit: parseIntegerInRange({
        value: context.propsValue.limit,
        fieldName: 'Limit',
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        defaultValue: 10_000,
      }),
    });
  },
});
