import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const makeCallAction = createAction({
  name: 'make-call',
  displayName: 'Make Call',
  description: 'Initiate an outbound call using an AI voice agent.',
  auth: kallabotAuth,
  props: {
    agent_id: Property.Dropdown({
      displayName: 'Agent',
      description: 'Select the agent to make the call.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await fetch('https://api.kallabot.com/v1/agents', {
            headers: {
              'Authorization': `Bearer ${auth}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (!data.agents || data.agents.length === 0) {
            return {
              options: [],
              disabled: true,
              placeholder: 'No agents found'
            };
          }

          return {
            options: data.agents.map((agent: any) => {
              const truncatedId = `${agent.agent_id.substring(0, 8)}...`;
              return {
                label: `${agent.name} (${truncatedId})`,
                value: agent.agent_id
              };
            })
          };
        } catch (e) {
          console.error('Error fetching agents:', e);
          return {
            options: [],
            disabled: true,
            placeholder: 'Failed to load agents'
          };
        }
      }
    }),
    recipient_phone_number: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description: 'The phone number to call in E.164 format (e.g., +1234567890).',
      required: true,
    }),
    sender_phone_number: Property.Dropdown({
      displayName: 'Sender Phone Number',
      description: 'Select the phone number to send the call from.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await fetch('https://api.kallabot.com/account-phone-numbers', {
            headers: {
              'Authorization': `Bearer ${auth}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (!data.phone_numbers || data.phone_numbers.length === 0) {
            return {
              options: [],
              disabled: true,
              placeholder: 'No phone numbers available'
            };
          }

          return {
            options: data.phone_numbers.map((number: any) => ({
              label: `${number.phone_number} (${number.friendly_name})`,
              value: number.phone_number
            }))
          };
        } catch (e) {
          console.error('Error fetching phone numbers:', e);
          return {
            options: [],
            disabled: true,
            placeholder: 'Failed to load phone numbers'
          };
        }
      }
    }),

    template_variables: Property.Object({
      displayName: 'Template Variables',
      description: 'Variables to replace placeholders in agent prompts. Only required if your agent prompts contain variables in {{variable.name}} format. Example: if prompt has {{customer.name}}, provide {"customer": {"name": "John"}}',
      required: false,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Optional webhook URL to receive call completion events. Use this for "Respond and Wait for Next Webhook" flows.',
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.kallabot.com/call',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        agent_id: context.propsValue.agent_id,
        recipient_phone_number: context.propsValue.recipient_phone_number,
        sender_phone_number: context.propsValue.sender_phone_number,
        template_variables: context.propsValue.template_variables,
        webhook_url: context.propsValue.webhook_url,
      },
    });

    // Mock response data for development/testing
    const mockResponse = {
      status: "success",
      message: "Call initiated successfully",
      call_details: {
        call_sid: "CA1234567890abcdef1234567890abcdef",
        from_number: context.propsValue.sender_phone_number,
        to_number: context.propsValue.recipient_phone_number,
        created_at: new Date().toISOString(),
        webhook_url: context.propsValue.webhook_url || context.propsValue.template_variables?.['webhook_url'] || null
      }
    };

    // Return actual response in production, mock data for development
    return process.env['NODE_ENV'] === 'development' ? mockResponse : response.body;
  },
});