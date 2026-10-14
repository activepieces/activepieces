import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';

export const linearRawGraphqlQuery = createAction({
  name: 'rawGraphqlQuery',
  classification: 'WRITE',
  displayName: 'Raw GraphQL Query',
  description: 'Send any GraphQL query or mutation to the Linear API.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an arbitrary GraphQL query or mutation directly to the Linear API with optional variables. Use as an escape hatch when no dedicated action covers the needed operation. Idempotency depends entirely on the supplied query; a read query is safe to repeat, a mutation is not.',
    idempotent: false,
  },
  auth: linearAuth,
  props: {
    query: Property.LongText({ displayName: 'Query', placeholder: 'query { viewer { id name } }', required: true }),
    variables: Property.Object({ displayName: 'Variables', description: 'Values for the $variables used in the query.', required: false }),
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
