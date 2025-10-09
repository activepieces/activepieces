import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const addContactToListAction = createAction({
    name: 'add-contact-to-list',
    displayName: 'Add Contacts to List',
    description: 'Add a contact or multiple contacts to an existing contact list.',
    auth: kallabotAuth,

    props: {
        list_id: Property.Dropdown({
            displayName: 'Contact List',
            description: 'Select the contact list to add contacts to.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
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
                                        
                    // Handle different response structures
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
        contacts: Property.Json({
            displayName: 'Contacts JSON',
            description: 'JSON array of contacts to add to the list. Each contact must have phone_number and can include name and template_variables.',
            required: true,
            defaultValue: [
                {
                    "phone_number": "+1234567890",
                    "name": "John Smith",
                    "template_variables": {
                        "first_name": "John",
                        "last_name": "Smith",
                        "company": "Acme Corp",
                        "custom_field": "value"
                    }
                },
                {
                    "phone_number": "+1987654321",
                    "name": "Jane Doe",
                    "template_variables": {
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "company": "Tech Solutions",
                        "priority": "high"
                    }
                }
            ]
        })
    },
    async run(context) {
        const contacts = context.propsValue.contacts || [];
        
        if (!Array.isArray(contacts) || contacts.length === 0) {
            throw new Error('At least one contact must be provided');
        }
        
        const payload = {
            contacts: contacts
        };
        
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.kallabot.com/contacts/${context.propsValue.list_id}/add`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            },
            body: payload
        });
        
        return response.body;
    }
});