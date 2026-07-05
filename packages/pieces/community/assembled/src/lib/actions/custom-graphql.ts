import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { assembledAuth } from '../common/auth';

export const customGraphql = createAction({
  name: 'custom_graphql',
  displayName: 'Custom GraphQL',
  description: 'Perform a custom GraphQL query',
  audience: 'both',
  aiMetadata: { description: 'Sends a raw GraphQL request to the Assembled API with an operation string and optional variables. Use as an escape hatch when no dedicated action covers the query or mutation you need. The supplied operation can read or write data, so it is not safe to assume repeating the call has no side effect.', idempotent: false },
  auth: assembledAuth,
  props: {
    query: Property.LongText({ displayName: 'Query', required: true }),
    variables: Property.Object({ displayName: 'Parameters', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = assembledCommon.makeClient(auth.secret_text);
    const result = await client.rawRequest(
      propsValue.query,
      propsValue.variables
    );
    return result;
  },
});
