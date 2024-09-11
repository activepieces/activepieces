import {
  createAction,
  DynamicProp,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FlowStatus, isNil, TriggerType } from '@activepieces/shared';

type FlowValue = {
  id: string;
  exampleData: unknown;
};

export const callFlow = createAction({
  name: 'callFlow',
  displayName: 'Call Flow',
  description: 'call another sub flow',
  props: {
    flow: Property.Dropdown<FlowValue>({
      displayName: 'Flow Title',
      description: 'The Name of the flow to execute',
      required: true,
      options: async (_, context) => {
        const allFlows = (await context.flows.list()).data;
        const flows = allFlows.filter(
          (flow) =>
            flow.status === FlowStatus.ENABLED &&
            flow.version.trigger.type === TriggerType.PIECE &&
            flow.version.trigger.settings.pieceName ==
              '@activepieces/piece-subflows'
        );
        return {
          options: flows.map((flow) => ({
            value: {
              id: flow.id,
              exampleData: flow.version.trigger.settings.input.exampleData,
            },
            label: flow.version.displayName,
          })),
        };
      },
      refreshers: [],
    }),
    flowProps: Property.DynamicProperties({
      description: '',
      displayName: '',
      required: true,
      refreshers: ['flow'],
      props: async (propsValue) => {
        const props: Record<string, DynamicProp> = {};
        const castedFlowValue = propsValue['flow'] as unknown as FlowValue;
        if (!isNil(castedFlowValue)) {
          props['payload'] = Property.Json({
            displayName: 'Payload',
            description:
              'Provide the data to be passed to the flow',
            required: true,
            defaultValue: castedFlowValue.exampleData as unknown as object,
          });
        }
        return props;
      },
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for Response',
      description: 'Wait for the response from the called flow',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.serverUrl}v1/webhooks/${context.propsValue.flow?.id}${
        context.propsValue.waitForResponse ? '/sync' : ''
      }`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context.propsValue.flowProps['payload']),
    });
    return response.body;
  },
});
