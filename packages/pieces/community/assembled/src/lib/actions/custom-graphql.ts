import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { assembledAuth } from '../common/auth';

export const customGraphql = createAction({
  name: 'custom_graphql',
  displayName: 'Custom GraphQL',
  description: 'Perform a custom GraphQL query',
  auth: assembledAuth,
  props: {
    query: Property.LongText({ displayName: 'Query', required: true }),
    variables: Property.Object({ displayName: 'Parameters', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = assembledCommon.makeClient(auth as string);
    const result = await client.rawRequest(
      propsValue.query,
      propsValue.variables
    );
    return result;
  },
});
