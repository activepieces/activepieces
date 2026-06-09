import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';

export const linearRawGraphqlQuery = createAction({
  name: 'rawGraphqlQuery',
  displayName: 'Raw GraphQL query',
  description: 'Perform a raw GraphQL query',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an arbitrary GraphQL query or mutation directly to the Linear API with optional variables. Use as an escape hatch when no dedicated action covers the needed operation. Idempotency depends entirely on the supplied query; a read query is safe to repeat, a mutation is not.',
    idempotent: false,
  },
  auth: linearAuth,
  props: {
    query: Property.LongText({ displayName: 'Query', required: true }),
    variables: Property.Object({ displayName: 'Parameters', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const result = await client.rawRequest(
      propsValue.query,
      propsValue.variables
    );
    return result;
  },
});
