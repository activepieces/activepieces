import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const getContactsFromListAction = createAction({
    name: 'get-contacts-from-list',
    displayName: 'Get Contacts from List',
    description: 'Retrieve all contacts from a specific contact list.',
    auth: kallabotAuth,

    props: {
        list_id: Property.Dropdown({
            displayName: 'Contact List',
            description: 'Select the contact list to retrieve contacts from.',
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
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.kallabot.com/contacts?list_id=${context.propsValue.list_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.body;
    }
});