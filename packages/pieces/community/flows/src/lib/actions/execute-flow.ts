import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

export const executeFlow = createAction({
  name: 'executeFlow',
  displayName: 'Execute Flow',
  description: 'executes the specified flow, and returns its response',
  props: {
    flowId: Property.Dropdown({ 
      displayName: 'Flow Title',
      description: 'The Name of the flow to execute',
      required: true,
      options: async (propsValue, context) => {
        const flows = await context.flows.list();
        return {
          options: flows.data.map(flow => ({
            value: flow.id,
            label: flow.version.displayName,
          }))
        };
      },
      refreshers: ['flows'],
  })},
  async run(context) {
    const headers = {
      'Content-Type': 'application/json',
    };
    const flowId = context.propsValue.flowId;

    const response = await fetch(`${context.serverUrl}v1/webhooks/${flowId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (!response) {
      throw new Error('Failed to execute flow');
    }

    return response.json();
  },
});
