import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { deleteAlgoliaRecordsByFilter } from '../common/client';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { algoliaProps } from '../common/props';
import { parseRequiredString } from '../common/utils';

export const deleteRecordsByFilterAction = createAction({
  auth: algoliaAuth,
  name: 'delete_records_by_filter',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Records by Filter',
  description: 'Deletes every record in an Algolia index that matches a filter. The API key needs the deleteIndex ACL.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes every record in one Algolia index that matches an Algolia filter expression, e.g. `category:books` or `price < 5`. The filter is required and cannot be empty. The API key needs the deleteIndex ACL (Algolia requires it for delete-by-query), otherwise the call fails with 403. Filter attributes must be in attributesForFaceting (see Get Index Settings), otherwise nothing matches; run Search Records with the same filters first to preview what will be deleted. Idempotent: repeating it deletes nothing more. Returns status published, or notPublished if Algolia was still deleting after 30 seconds (it will still be applied).',
    idempotent: true,
  },
  outputSchema: algoliaOutputSchemas.deleteRecordsByFilter,
  props: {
    indexName: algoliaProps.indexName(),
    filters: Property.ShortText({
      displayName: 'Filters',
      description: 'Algolia filter expression selecting the records to delete, e.g. category:books.',
      required: true,
    }),
  },
  async run(context) {
    const { propsValue } = context;

    return deleteAlgoliaRecordsByFilter({
      auth: context.auth,
      indexName: parseRequiredString(propsValue.indexName, 'Index Name'),
      filters: parseRequiredString(propsValue.filters, 'Filters'),
    });
  },
});
