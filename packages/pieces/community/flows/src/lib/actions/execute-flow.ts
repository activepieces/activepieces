import {
  createAction,
  DynamicProp,
  DynamicPropsValue,
  Property,
  PropertyContext,
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
  }),
  sampleData: Property.DynamicProperties({
    description: 'The schema to be passed to the flow',
    displayName: 'Sample Data',
    required: true,
    refreshers: ['flows'],
    props: async (propsValue, context) => {
        const flow = (await context.flows.list()).data.find(flow => flow.id === propsValue['flowId'] as unknown as string);

        const properties = {
            exampleData: Property.Json({
            displayName: 'Sample Data',
            description: 'The schema to be passed to the flow',
            required: true,
            defaultValue: flow?.version.trigger.settings?.input.exampleData,
          }) as unknown as DynamicProp,
        };

        return properties;
    },
  }),
  },
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
