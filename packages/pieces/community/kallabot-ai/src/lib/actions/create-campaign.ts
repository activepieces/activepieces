import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const createCampaignAction = createAction({
    name: 'create-campaign',
    displayName: 'Create Campaign',
    description: 'Create a new outbound calling campaign.',
    auth: kallabotAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Campaign Name',
            description: 'The name of the campaign.',
            required: true
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A description of the campaign (optional).',
            required: false
        }),
        agent_id: Property.Dropdown({
            displayName: 'Agent',
            description: 'Select the AI agent to use for the campaign.',
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
                    
                    // Handle different response structures
                    if (agents && typeof agents === 'object') {
                        if (agents.data && Array.isArray(agents.data)) {
                            agents = agents.data;
                        }
                        else if (agents.agents && Array.isArray(agents.agents)) {
                            agents = agents.agents;
                        }
                        else if (!Array.isArray(agents)) {
                            console.warn('Agents response is not an array:', agents);
                            return {
                                disabled: true,
                                options: [],
                                placeholder: 'Invalid response format from API'
                            };
                        }
                    }
                    
                    if (!Array.isArray(agents)) {
                        console.warn('Agents is not an array after processing:', agents);
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid agents data format'
                        };
                    }
                    
                    // Filter out inbound-only agents
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
                    console.error('Error details:', error instanceof Error ? error.message : String(error));
                    return {
                        disabled: true,
                        options: [],
                        placeholder: `Error loading agents: ${error instanceof Error ? error.message : 'Network error'}`
                    };
                }
            }
        }),
        list_id: Property.Dropdown({
            displayName: 'Contact List',
            description: 'Select the contact list for the campaign.',
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
                        url: 'https://api.kallabot.com/contacts/lists',
                        headers: {
                            'Authorization': `Bearer ${auth}`,
                            'Content-Type': 'application/json'
                        }
                    });
                                        
                    let lists: any[] = [];
                    if (Array.isArray(response.body)) {
                        lists = response.body;
                    } else if (response.body && Array.isArray(response.body.data)) {
                        lists = response.body.data;
                    } else if (response.body && Array.isArray(response.body.lists)) {
                        lists = response.body.lists;
                    } else if (response.body && Array.isArray(response.body.contact_lists)) {
                        lists = response.body.contact_lists;
                    } else {
                        console.error('Unexpected API response structure:', response.body);
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid response format from API'
                        };
                    }
                    
                    if (!Array.isArray(lists)) {
                        console.error('Lists is not an array:', lists);
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid data format'
                        };
                    }
                    
                    return {
                        options: lists.map(list => {
                            const listId = list.list_id || list.id;
                            const listName = list.name || 'Unnamed List';
                            const shortId = listId ? listId.substring(0, 8) + '...' : 'xxxxxxxx...';
                            return {
                                label: `(${shortId}) ${listName} (${list.contact_count || 0} contacts)`,
                                value: listId
                            };
                        })
                    };
                } catch (error) {
                    console.error('Error fetching contact lists:', error);
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading contact lists'
                    };
                }
            }
        }),
        sender_phone_numbers: Property.MultiSelectDropdown({
            displayName: 'Sender Phone Numbers',
            description: 'Select phone numbers to use for making calls.',
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
                                        
                    let phoneNumbers: any[] = [];
                    if (Array.isArray(response.body)) {
                        phoneNumbers = response.body;
                    } else if (response.body && Array.isArray(response.body.data)) {
                        phoneNumbers = response.body.data;
                    } else if (response.body && Array.isArray(response.body.phone_numbers)) {
                        phoneNumbers = response.body.phone_numbers;
                    } else {
                        console.error('Unexpected API response structure:', response.body);
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid response format from API'
                        };
                    }
                    
                    if (!Array.isArray(phoneNumbers)) {
                        console.error('Phone numbers is not an array:', phoneNumbers);
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid data format'
                        };
                    }
                    
                    return {
                        disabled: false,
                        options: phoneNumbers.map(number => ({
                            label: `${number.phone_number || number.number} (${number.friendly_name || 'No name'})`,
                            value: number.phone_number || number.number
                        }))
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
        delay_between_calls: Property.Number({
            displayName: 'Delay Between Calls (seconds)',
            description: 'Time to wait between calls in seconds.',
            required: false,
            defaultValue: 10
        }),
        scheduled_time: Property.DateTime({
            displayName: 'Scheduled Time',
            description: 'When to start the campaign (format: YYYY-MM-DDTHH:MM:SS) ISO 8601.',
            required: true,
            defaultValue: '2026-08-01T13:15:00'
        }),
        timezone: Property.ShortText({
            displayName: 'Timezone',
            description: 'Timezone for the scheduled time (e.g., America/New_York).',
            required: false,
            defaultValue: 'UTC'
        }),
        rotate_numbers_after: Property.Number({
            displayName: 'Rotate Numbers After',
            description: 'Number of contacts to call before rotating to the next phone number.',
            required: false,
            defaultValue: 60
        })
    },
    async run(context) {
        const payload: any = {
            name: context.propsValue.name,
            list_id: context.propsValue.list_id,
            agent_id: context.propsValue.agent_id,
            sender_phone_numbers: context.propsValue.sender_phone_numbers || [],
            delay_between_calls: context.propsValue.delay_between_calls || 10,
            scheduled_time: new Date(context.propsValue.scheduled_time).toISOString().slice(0, 19),
            timezone: context.propsValue.timezone || 'UTC',
            rotate_numbers_after: context.propsValue.rotate_numbers_after || 10
        };
        
        if (context.propsValue.description) {
            payload.description = context.propsValue.description;
        }
        
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.kallabot.com/campaign',
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            },
            body: payload
        });
        
        return response.body;
    }
});