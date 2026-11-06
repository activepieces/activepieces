import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const getCollectionAction = createAction({
  auth: memAuth,
  name: 'get_collection',
  classification: 'READ',
  displayName: 'Get Collection',
  description: 'Get the details of a collection.',
  audience: 'both',
  aiMetadata: {
    description: 'Reads one Mem collection by ID and returns its title, description, note count and timestamps (metadata only, not its notes; use List Notes with a collection to get them). Read-only.',
    idempotent: true,
  },
  props: {
    collection_id: memProps.collectionDropdown({ displayName: 'Collection', description: 'The collection to read.', required: true }),
  },
  outputSchema: memSchemas.collection,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: memClient.encodePath`/collections/${context.propsValue.collection_id}`,
    });
  },
});
