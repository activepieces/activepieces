import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { saveAlgoliaRecords } from '../common/client';
import { parseAlgoliaRecordArray, parseRequiredString } from '../common/utils';

export const saveRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'save-records',
  displayName: 'Save Records',
  description: 'Adds or updates records in an Algolia index.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds or updates one or more records in an Algolia search index (creating the index if it does not yet exist). Pass an array of JSON objects; include an `objectID` on a record to overwrite that existing record, or omit it to have Algolia generate a new one. Not idempotent: records without an `objectID` create a fresh record on every call, so repeating the call appends duplicates.',
    idempotent: false,
  },
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
        'Provide an array of JSON objects to save. Include `objectID` to update an existing record, or omit it to let Algolia create one.',
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
