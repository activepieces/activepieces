import { createAction } from '@activepieces/pieces-framework';
import { bql_props } from '../common/props';
import { validate_props } from '../common/validations';

export const run_bql_query = createAction({
  name: 'run_bql_query',
  displayName: 'Run BQL Query',
  description: 'Run a Browser Query Lang (BQL) mutation.',
  props: bql_props,
  async run(context) {
    // Add validation
    await validate_props.run_bql_query(context.propsValue);

    const query = context.propsValue.add_query;
    const token = context.auth as string;

    // Fix 1: Use correct BQL endpoint
    const bqlEndpoint = `https://production-sfo.browserless.io/chromium/bql?token=${token}`;

    const response = await fetch(bqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Remove Authorization header - token is in URL
      },
      body: JSON.stringify({ 
        query: query,
        // Add variables if needed
        variables: {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to run BQL query: ${errorText}`);
    }

    const result = await response.json();
    return result;
  }
});
