import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listLinkedBusinessesActionOutputSchema } from '../output-schemas';

export const listLinkedBusinesses = createAction({
  auth: pinterestAuth,
  name: 'listLinkedBusinesses',
  classification: 'READ',
  outputSchema: listLinkedBusinessesActionOutputSchema,
  displayName: 'List Linked Businesses',
  description: 'List the business accounts linked to the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the business accounts linked to the connected account, returning each business id and username. Use it when an action needs to operate on behalf of a linked business rather than the personal account. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      '/user_account/businesses'
    );

    const items = Array.isArray(response) ? response : [];
    return { items, count: items.length };
  },
});
