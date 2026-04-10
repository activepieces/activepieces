import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { browseAlgoliaRecords } from '../common/client';
import { algoliaProps } from '../common/props';
import { parseRequiredString } from '../common/utils';

export const browseRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'browse-records',
  displayName: 'Browse Records',
  description: 'Retrieves records from an Algolia index.',
  props: {
    indexName: algoliaProps.index(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to retrieve. Defaults to 10,000.',
      required: false,
      defaultValue: 10_000,
    }),
  },
  async run(context) {
    const indexName = parseRequiredString(context.propsValue.indexName, 'Index');

    return browseAlgoliaRecords({
      auth: context.auth,
      indexName,
      limit: context.propsValue.limit ?? 10_000,
    });
  },
});
