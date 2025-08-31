import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const makeCallAction = createAction({
  name: 'make-call',
  displayName: 'Make Call',
  description: 'Initiate an outbound call using Kallabot AI agent.',
  auth: kallabotAuth,

  props: {
    agent_id: Property.Dropdown({
        displayName: 'Agent',
        description: 'Select the AI agent to use for the call.',
        required: true,
        refreshers: ['auth'],
        options: async ({ auth }: { auth?: string }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please connect your account first'
                };
            }
            try {
                const response = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: 'https://api.kallabot.com/agents',
                    headers: {
                        'Authorization': `Bearer ${auth}`,
                        'Content-Type': 'application/json'
                    }
                });
                let agents = response.body;
                if (agents && typeof agents === 'object') {
                    if (agents.data && Array.isArray(agents.data)) {
                        agents = agents.data;
                    }
                    else if (agents.agents && Array.isArray(agents.agents)) {
                        agents = agents.agents;
                    }
                    else if (!Array.isArray(agents)) {
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid response format from API'
                        };
                    }
                }
                if (!Array.isArray(agents)) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Invalid agents data format'
                    };
                }
                const outboundAgents = agents.filter(agent => agent.call_direction !== 'inbound');
                return {
                    options: outboundAgents.map(agent => {
                        const agentId = agent.agent_id || agent.id;
                        const agentName = agent.name || 'Unnamed Agent';
                        const shortId = agentId ? agentId.substring(0, 8) + '...' : 'xxxxxxxx...';
                        return {
                            label: `(${shortId}) ${agentName}`,
                            value: agentId
                        };
                    })
                };
            } catch (error) {
                console.error('Error fetching agents:', error);
                return {
                    disabled: true,
                    options: [],
                    placeholder: `Error loading agents: ${error instanceof Error ? error.message : 'Network error'}`
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
      description: 'The phone number to make the call from.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }: { auth?: string }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first'
          };
        }
        
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.kallabot.com/account-phone-numbers',
            headers: {
              'Authorization': `Bearer ${auth}`,
              'Content-Type': 'application/json'
            }
          });
                    
          let phoneNumbers = response.body;
          
          // Handle different response structures
          if (phoneNumbers && typeof phoneNumbers === 'object') {
            // If response has a data property containing the array
            if (phoneNumbers.data && Array.isArray(phoneNumbers.data)) {
              phoneNumbers = phoneNumbers.data;
            }
            // If response has a phone_numbers property containing the array
            else if (phoneNumbers.phone_numbers && Array.isArray(phoneNumbers.phone_numbers)) {
              phoneNumbers = phoneNumbers.phone_numbers;
            }
            // If response is not an array, try to convert or handle gracefully
            else if (!Array.isArray(phoneNumbers)) {
              console.warn('Phone numbers response is not an array:', phoneNumbers);
              return {
                disabled: true,
                options: [],
                placeholder: 'Invalid response format from API'
              };
            }
          }
          
          // Ensure phoneNumbers is an array before mapping
          if (!Array.isArray(phoneNumbers)) {
            console.warn('Phone numbers is not an array after processing:', phoneNumbers);
            return {
              disabled: true,
              options: [],
              placeholder: 'Invalid phone numbers data format'
            };
          }
          
          return {
            options: phoneNumbers.map(phone => {
              const phoneNumber = phone.phone_number || phone.number || 'Unknown Number';
              const friendlyName = phone.friendly_name || phone.name || phoneNumber;
              return {
                label: `(${phoneNumber}) ${friendlyName}`,
                value: phoneNumber
              };
            })
          };
        } catch (error) {
          console.error('Error fetching phone numbers:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading phone numbers'
          };
        }
      }
    }),
    template_variables: Property.Object({
      displayName: 'Template Variables',
      description: 'Variables to be used in the agent template (optional).',
      required: false
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL to receive call status updates (optional).',
      required: false
    })
  },
  async run(context) {
    const { agent_id, recipient_phone_number, sender_phone_number, template_variables, webhook_url } = context.propsValue;

    const requestBody: any = {
      agent_id,
      recipient_phone_number,
      sender_phone_number,
    };

    if (template_variables) {
      requestBody.template_variables = template_variables;
    }

    if (webhook_url) {
      requestBody.webhook_url = webhook_url;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.kallabot.com/call',
        headers: {
          'Authorization': `Bearer ${context.auth}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      return {
        success: true,
        call_id: response.body.call_id || response.body.id,
        status: response.body.status || 'initiated',
        message: 'Call initiated successfully',
        response: response.body
      };
    } catch (error) {
      console.error('Error making call:', error);
      
      let errorMessage = 'Failed to initiate call';
      
      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.response && err.response.body) {
          errorMessage = err.response.body.message || err.response.body.error || errorMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      throw new Error(`Failed to initiate call: ${errorMessage}`);
    }
  }
});