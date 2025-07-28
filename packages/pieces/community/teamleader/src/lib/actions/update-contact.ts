import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const updateContact = createAction({
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update an existing contact record in Teamleader',
    auth: teamleaderAuth,
    props: {
        contact_id: Property.Dropdown({
            displayName: 'Contact',
            description: 'The contact to update',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                try {
                    const response = await teamleaderCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: '/contacts.list',
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((contact: any) => ({
                            label: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                            value: contact.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading contacts'
                    };
                }
            }
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: 'First name of the contact',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name of the contact',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email address of the contact',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Phone number of the contact',
            required: false,
        }),
        mobile: Property.ShortText({
            displayName: 'Mobile',
            description: 'Mobile number of the contact',
            required: false,
        }),
        website: Property.ShortText({
            displayName: 'Website',
            description: 'Website URL of the contact',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Additional details about the contact',
            required: false,
        }),
    },
    async run(context) {
        const updateData: Record<string, any> = {};

        // Add fields that are provided
        if (context.propsValue.first_name) updateData['first_name'] = context.propsValue.first_name;
        if (context.propsValue.last_name) updateData['last_name'] = context.propsValue.last_name;
        if (context.propsValue.email) {
            updateData['emails'] = [{
                type: 'primary',
                email: context.propsValue.email
            }];
        }
        if (context.propsValue.phone) {
            updateData['telephones'] = [{
                type: 'phone',
                number: context.propsValue.phone
            }];
        }
        if (context.propsValue.mobile) {
            if (!updateData['telephones']) updateData['telephones'] = [];
            updateData['telephones'].push({
                type: 'mobile',
                number: context.propsValue.mobile
            });
        }
        if (context.propsValue.website) updateData['website'] = context.propsValue.website;
        if (context.propsValue.description) updateData['description'] = context.propsValue.description;

        // Update contact using Teamleader API
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts.update',
            body: {
                id: context.propsValue.contact_id,
                ...updateData
            }
        });

        // Get and return the updated contact data
        const updatedContact = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/contacts.info',
            queryParams: {
                id: context.propsValue.contact_id
            }
        });

        return updatedContact.body;
    },
});
