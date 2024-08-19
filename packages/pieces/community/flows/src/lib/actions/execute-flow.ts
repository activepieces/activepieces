import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { FlowStatus } from '@activepieces/shared';



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
        const flows = (await context.flows.list()).data.filter(flow => flow.status === FlowStatus.ENABLED);
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
    const flowId = context.propsValue.flowId;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${context.serverUrl}v1/webhooks/${flowId}`,
      headers,
      body: JSON.stringify({})
    };
    const response = await httpClient.sendRequest(request);

    if (!response) {
      throw new Error('Failed to execute flow');
    }

    return response;
  },
});
