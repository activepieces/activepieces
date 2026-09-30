import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { APITableAuth } from '../auth';
import { listSpacesActionOutputSchema } from '../output-schemas';

export const listSpacesAction = createAction({
  auth: APITableAuth,
  name: 'apitable_list_spaces',
  classification: 'SEARCH',
  displayName: 'List Spaces',
  description: 'Lists the spaces available to the authenticated account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every space (workspace) the authenticated AITable account can access, returning each space\'s ID and name. Use to discover a space ID before listing its datasheets. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {},
  outputSchema: listSpacesActionOutputSchema,
  async run(context) {
    const client = makeClient(context.auth.props);
    const response = await client.listSpaces();

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
