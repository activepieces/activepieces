import { createAction } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { getAlgoliaIndexSettings } from '../common/client';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { algoliaProps } from '../common/props';
import { parseRequiredString } from '../common/utils';

export const getIndexSettingsAction = createAction({
  auth: algoliaAuth,
  name: 'get_index_settings',
  classification: 'READ',
  displayName: 'Get Index Settings',
  description: 'Gets the settings of an Algolia index.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the settings of one Algolia index, including searchableAttributes, attributesForFaceting (the attributes usable in filters), customRanking and replicas. Call this before using filters in Search Records or Delete Records by Filter. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: algoliaOutputSchemas.getIndexSettings,
  props: {
    indexName: algoliaProps.indexName(),
  },
  async run(context) {
    const settings = await getAlgoliaIndexSettings({
      auth: context.auth,
      indexName: parseRequiredString(context.propsValue.indexName, 'Index Name'),
    });

    return { settings };
  },
});
