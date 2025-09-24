import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WidgetItemSchema, WidgetItem } from '../schemas';

export const makeOutboundCallAction = createAction({
  name: 'make_outbound_call',
  displayName: 'Make Outbound Call',
  description: 'Initiate an outbound call to a phone number using a configured widget',
  props: {
    widget_id: Property.Dropdown({
      displayName: 'Widget',
      description: 'Widget connected to Twilio, Plivo, or Telnyx for making calls',
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

          // Validate the response data
          const validatedItems: WidgetItem[] = [];
          for (const item of data.items) {
            try {
              const parsedItem = WidgetItemSchema.parse(item);
              validatedItems.push(parsedItem);
            } catch {
              continue;
            }
          }

          const options = validatedItems.map((item) => ({
            label: `${item.name || item.display_name || 'Unnamed'} (${item.widget_type} - ${item.widget_provider || 'No Provider'})`,
            value: item.id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch {
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
      description: 'Phone number in E.164 format (e.g., 16501234567)',
      required: true,
    }),
    prompt_dynamic_variables: Property.Object({
      displayName: 'Dynamic Variables',
      description: 'Variables for call prompts (e.g., {"name": "Bob", "appointment": "tomorrow"})',
      required: false,
    }),
  },
  async run(context) {
    try {
      const widget_id = context.propsValue['widget_id'];
      const to = context.propsValue['to'];
      const prompt_dynamic_variables = context.propsValue['prompt_dynamic_variables'];

      if (!widget_id) {
        throw new Error('Widget is required. Please select a widget from the dropdown.');
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

      if (!response.body) {
        throw new Error('No response received from Insighto.ai API');
      }

      return response.body;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to make outbound call: ${error.message}`);
      }
      throw new Error('Failed to make outbound call');
    }
  },
});
