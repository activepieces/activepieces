import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { deleteAlgoliaRecords } from '../common/client';
import { algoliaProps } from '../common/props';
import { parseRequiredString, parseStringArray } from '../common/utils';

export const deleteRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'delete-records',
  displayName: 'Delete Records',
  description: 'Deletes records from an Algolia index by objectID.',
  props: {
    indexName: algoliaProps.index(),
    recordIds: Property.Array({
      displayName: 'Record IDs',
      description:
        'Provide the Algolia objectIDs to delete from the selected index.',
      required: true,
    }),
  },
  async run(context) {
    const indexName = parseRequiredString(context.propsValue.indexName, 'Index');
    const objectIDs = parseStringArray(context.propsValue.recordIds, 'Record IDs');

    return deleteAlgoliaRecords({
      auth: context.auth,
      indexName,
      objectIDs,
    });
  },
});
