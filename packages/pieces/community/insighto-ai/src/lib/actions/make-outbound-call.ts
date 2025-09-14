import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

interface Widget {
  id: string;
  name: string;
}

export const makeOutboundCall = createAction({
  auth: insightoAiAuth,
  name: 'make_outbound_call',
  displayName: 'Make Outbound Call',
  description:
    'Makes an outbound call to a given number using a specified widget.',
  props: {
    widgetId: Property.Dropdown({
      displayName: 'Widget',
      description: 'Select the widget to use for initiating the call.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await httpClient.sendRequest<{
          data: { items: Widget[] };
        }>({
          method: HttpMethod.GET,
          url: 'https://api.insighto.ai/v1/widget',
          headers: { Authorization: `Bearer ${auth as string}` },
        });
        return {
          disabled: false,
          options: response.body.data.items.map((widget) => ({
            label: widget.name,
            value: widget.id,
          })),
        };
      },
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description:
        'The destination phone number. Must be in E.164 format (e.g., 16501234567).',
      required: true,
    }),
    promptDynamicVariables: Property.Json({
      displayName: 'Dynamic Variables',
      description: 'JSON object of dynamic variables to be used in the prompt.',
      required: false,
    }),
  },

  async run(context) {
    const { widgetId, toNumber, promptDynamicVariables } = context.propsValue;

    const requestBody: { to: string; prompt_dynamic_variables?: object } = {
      to: toNumber,
    };

    if (promptDynamicVariables) {
      requestBody.prompt_dynamic_variables =
        typeof promptDynamicVariables === 'string'
          ? JSON.parse(promptDynamicVariables)
          : promptDynamicVariables;
    }

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.insighto.ai/v1/call/${widgetId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
      body: requestBody,
    });
  },
});
