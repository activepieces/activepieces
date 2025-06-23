import { createAction, Property } from '@activepieces/pieces-framework';

export const runCustomSql = createAction({
  name: 'run_custom_sql',
  displayName: 'Run Custom SQL',
  description: 'Execute a custom SQL query on a selected org',
  props: {
    query: Property.LongText({
      displayName: 'SQL Query',
      required: true,
      description: 'Write your custom SQL query here.',
    }),
  },

  async run({ auth, propsValue }) {
    const { orgId } = auth as { orgId: string };
    const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
    const { query } = propsValue;

    const response = await fetch(`${baseUrl}/dbBuilder/${orgId}/customQuery/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`(${response.status}) ${errText}`);
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  },
});
