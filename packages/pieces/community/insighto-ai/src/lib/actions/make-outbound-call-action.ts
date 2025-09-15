import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const makeOutboundCallAction = createAction({
  name: 'make_outbound_call',
  displayName: 'Make Outbound Call',
  description: 'Makes outbound call to given a number',
  props: {
    widget_id: Property.Dropdown({
      displayName: 'Widget',
      description: 'Select the widget to use for initiating the call. It must be connected to Twilio, Plivo or Telnyx.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const apiKey = auth as string;
          const url = `https://api.insighto.ai/api/v1/widget`;

          const queryParams: Record<string, string> = {
            api_key: apiKey,
            page: '1',
            size: '100', // Get more widgets for better UX
          };

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            queryParams,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = response.body.data;
          if (!data || !data.items) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No widgets found'
            };
          }

          const options = data.items.map((item: any) => ({
            label: `${item.name || item.display_name || 'Unnamed'} (${item.widget_type} - ${item.widget_provider || 'No Provider'})`,
            value: item.id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          console.error('Error loading widgets:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load widgets'
          };
        }
      },
    }),
    to: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to call. Must be in E.164 format. Ex: 16501234567',
      required: true,
    }),
    prompt_dynamic_variables: Property.Object({
      displayName: 'Prompt Dynamic Variables',
      description: 'Dynamic variables to be used in the prompt. Ex: {\'name\': \'Bob\', \'appointment_day\': \'tomorrow\', \'reason\': \'for confirmation of appointment\'}',
      required: false,
    }),
  },
  async run(context) {
    const widget_id = context.propsValue['widget_id'];
    const to = context.propsValue['to'];
    const prompt_dynamic_variables = context.propsValue['prompt_dynamic_variables'];

    if (!widget_id) {
      throw new Error('Widget ID is required. Please select a widget from the dropdown.');
    }

    if (!to) {
      throw new Error('Phone number is required.');
    }

    const apiKey = context.auth as string;

    const url = `https://api.insighto.ai/api/v1/call/${widget_id}`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
    };

    const body: any = {
      to,
    };

    if (prompt_dynamic_variables) {
      body.prompt_dynamic_variables = prompt_dynamic_variables;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      queryParams,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
