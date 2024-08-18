import { AuthenticationType } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

export const executeFlow = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
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
          options: flows.map(flow => ({
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
    // get selected option
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
