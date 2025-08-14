import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const editContactListAction = createAction({
    name: 'edit-contact-list',
    displayName: 'Edit Contact List',
    description: 'Update/replace all contacts in an existing contact list.',
    auth: kallabotAuth,

    props: {
        list_id: Property.Dropdown({
            displayName: 'Contact List',
            description: 'Select the contact list to edit.',
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
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid response format from API'
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
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading contact lists'
                    };
                }
            }
        }),
        contacts: Property.DynamicProperties({
            displayName: 'Contacts',
            description: 'JSON array of contacts to replace the entire list',
            required: true,
            refreshers: ['list_id'],
            props: async ({ list_id, auth }) => {
                if (!list_id || !auth) {
                    return {
                        contacts: Property.Json({
                            displayName: 'Contacts JSON',
                            description: 'JSON array of contacts to replace the entire list. Each contact must have phone_number and can include name and template_variables.',
                            required: true,
                            defaultValue: [
                                {
                                    "phone_number": "+1234567890",
                                    "name": "Sample Contact",
                                    "template_variables": {}
                                }
                            ]
                        })
                    };
                }

                try {
                    // Use the correct endpoint format with query parameter
                    const response = await httpClient.sendRequest({
                        method: HttpMethod.GET,
                        url: `https://api.kallabot.com/contacts?list_id=${list_id}`,
                        headers: {
                            'Authorization': `Bearer ${auth}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    let contacts: any[] = [];
                    if (Array.isArray(response.body)) {
                        contacts = response.body;
                    } else if (response.body && Array.isArray(response.body.contacts)) {
                        contacts = response.body.contacts;
                    } else if (response.body && Array.isArray(response.body.data)) {
                        contacts = response.body.data;
                    } else {
                        contacts = [];
                    }

                    const formattedContacts = contacts.map(contact => ({
                        phone_number: contact.phone_number || contact.phone || '',
                        name: contact.name || '',
                        template_variables: contact.template_variables || contact.custom_fields || {}
                    })).filter(contact => contact.phone_number);

                    return {
                        contacts: Property.Json({
                            displayName: 'Contacts JSON',
                            description: `Current contacts from list. Edit this JSON to update the entire list.`,
                            required: true,
                            defaultValue: formattedContacts.length > 0 ? formattedContacts : [
                                {
                                    "phone_number": "+1234567890",
                                    "name": "New Contact",
                                    "template_variables": {}
                                }
                            ]
                        })
                    };
                } catch (error) {
                    return {
                        contacts: Property.Json({
                            displayName: 'Contacts JSON',
                            description: 'Could not load contacts. Please enter manually.',
                            required: true,
                            defaultValue: [
                                {
                                    "phone_number": "+1234567890",
                                    "name": "New Contact",
                                    "template_variables": {}
                                }
                            ]
                        })
                    };
                }
            }
        })
    },
    async run(context) {
        // Fix the TypeScript error by using bracket notation for DynamicProperties
        const contacts = context.propsValue['contacts']?.['contacts'] || [];
        
        if (!Array.isArray(contacts) || contacts.length === 0) {
            throw new Error('At least one contact must be provided');
        }
        
        const payload = {
            contacts: contacts
        };
        
        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.kallabot.com/contacts/${context.propsValue.list_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            },
            body: payload
        });
        
        return response.body;
    }
});