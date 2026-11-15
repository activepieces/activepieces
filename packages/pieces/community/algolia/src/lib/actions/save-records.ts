import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { saveAlgoliaRecords } from '../common/client';
import { parseAlgoliaRecordArray, parseRequiredString } from '../common/utils';

export const saveRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'save-records',
  classification: 'WRITE',
  displayName: 'Save Records',
  description: 'Adds records to an Algolia index. A record with an existing objectID replaces that whole record.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds or updates one or more records in an Algolia search index (creating the index if it does not yet exist). Pass an array of JSON objects; include an `objectID` on a record to fully replace the existing record with that ID (attributes not in the new object are removed), or omit it to have Algolia generate a new one. Not idempotent: records without an `objectID` create a fresh record on every call, so repeating the call appends duplicates. Arrays over 1,000 records are sent in several batches. Returns the taskID, objectIDs and status: published, or notPublished when Algolia was still applying the write after 30 seconds (the write is accepted and will still be applied, so do not retry).',
    idempotent: false,
  },
  outputSchema: algoliaOutputSchemas.writeRecords,
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description:
        'Enter an existing index name or a new one — Algolia creates it automatically.',
      required: true,
    }),
    records: Property.Json({
      displayName: 'Records',
      description:
        'Array of JSON objects to save. A record with an existing objectID replaces that whole record (fields you leave out are removed); omit objectID to let Algolia create one.',
      required: true,
    }),
  },
  async run(context) {
    const indexName = parseRequiredString(context.propsValue.indexName, 'Index Name');
    const records = parseAlgoliaRecordArray(context.propsValue.records);

    return saveAlgoliaRecords({
      auth: context.auth,
      indexName,
      records,
    });
  },
});
