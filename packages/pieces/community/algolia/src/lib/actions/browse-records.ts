import { createAction } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { browseAlgoliaRecords } from '../common/client';
import { algoliaProps } from '../common/props';
import { parseRequiredString } from '../common/utils';

export const browseRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'browse-records',
  displayName: 'Browse Records',
  description: 'Retrieves all records from an Algolia index.',
  props: {
    indexName: algoliaProps.index(),
  },
  async run(context) {
    const indexName = parseRequiredString(context.propsValue.indexName, 'Index');

    return browseAlgoliaRecords({
      auth: context.auth,
      indexName,
    });
  },
});
