import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { getAlgoliaRecord } from '../common/client';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { algoliaProps } from '../common/props';
import { parseOptionalStringArray, parseRequiredString } from '../common/utils';

export const getRecordAction = createAction({
  auth: algoliaAuth,
  name: 'get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Gets one record from an Algolia index by objectID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Fetches a single record from an Algolia index by its exact objectID and returns it with all (or the requested) attributes. Fails with a not-found error if the objectID or index does not exist. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: algoliaOutputSchemas.getRecord,
  props: {
    indexName: algoliaProps.indexName(),
    objectID: Property.ShortText({
      displayName: 'Object ID',
      description: 'The objectID of the record.',
      required: true,
    }),
    attributesToRetrieve: Property.Array({
      displayName: 'Attributes To Retrieve',
      description: 'Only return these attributes. Leave empty to return all retrievable attributes.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const record = await getAlgoliaRecord({
      auth: context.auth,
      indexName: parseRequiredString(propsValue.indexName, 'Index Name'),
      objectID: parseRequiredString(propsValue.objectID, 'Object ID'),
      attributesToRetrieve: parseOptionalStringArray({
        value: propsValue.attributesToRetrieve,
        fieldName: 'Attributes To Retrieve',
      }),
    });

    return { record };
  },
});
