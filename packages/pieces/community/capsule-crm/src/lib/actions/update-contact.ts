import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const updateContact = createAction({
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update an existing Person or Organisation contact',
    auth: capsuleAuth,
    props: {
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'The ID of the party (person or organisation) to update',
            required: true,
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'Updated first name (for persons only)',
            required: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Updated last name (for persons only)',
            required: false,
        }),
        organisationName: Property.ShortText({
            displayName: 'Organisation Name',
            description: 'Updated organisation name (for organisations only)',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'Updated job title or position',
            required: false,
        }),
        emails: Property.Array({
            displayName: 'Email Addresses',
            description: 'Updated email addresses (replaces existing ones)',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Work', value: 'Work' },
                            { label: 'Home', value: 'Home' },
                            { label: 'Other', value: 'Other' }
                        ]
                    }
                }),
                address: Property.ShortText({
                    displayName: 'Email Address',
                    required: true,
                })
            }
        }),
        phoneNumbers: Property.Array({
            displayName: 'Phone Numbers',
            description: 'Updated phone numbers (replaces existing ones)',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Work', value: 'Work' },
                            { label: 'Home', value: 'Home' },
                            { label: 'Mobile', value: 'Mobile' },
                            { label: 'Fax', value: 'Fax' },
                            { label: 'Direct', value: 'Direct' },
                            { label: 'Other', value: 'Other' }
                        ]
                    }
                }),
                number: Property.ShortText({
                    displayName: 'Phone Number',
                    required: true,
                })
            }
        }),
        addresses: Property.Array({
            displayName: 'Addresses',
            description: 'Updated addresses (replaces existing ones)',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Work', value: 'Work' },
                            { label: 'Home', value: 'Home' },
                            { label: 'Postal', value: 'Postal' },
                            { label: 'Other', value: 'Other' }
                        ]
                    }
                }),
                street: Property.ShortText({
                    displayName: 'Street',
                    required: true,
                }),
                city: Property.ShortText({
                    displayName: 'City',
                    required: true,
                }),
                state: Property.ShortText({
                    displayName: 'State/Province',
                    required: false,
                }),
                country: Property.ShortText({
                    displayName: 'Country',
                    required: false,
                }),
                zip: Property.ShortText({
                    displayName: 'ZIP/Postal Code',
                    required: false,
                })
            }
        }),
        websites: Property.Array({
            displayName: 'Websites',
            description: 'Updated websites (replaces existing ones)',
            required: false,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    options: {
                        options: [
                            { label: 'Work', value: 'Work' },
                            { label: 'Home', value: 'Home' },
                            { label: 'Other', value: 'Other' }
                        ]
                    }
                }),
                url: Property.ShortText({
                    displayName: 'URL',
                    required: true,
                })
            }
        }),
        about: Property.LongText({
            displayName: 'About',
            description: 'Updated information about the contact',
            required: false,
        })
    },
    async run(context) {
        const { partyId, firstName, lastName, organisationName, title, emails, phoneNumbers, addresses, websites, about } = context.propsValue;

        const party: Record<string, any> = {};

        if (firstName) party['firstName'] = firstName;
        if (lastName) party['lastName'] = lastName;
        if (organisationName) party['name'] = organisationName;
        if (title) party['title'] = title;
        if (about !== undefined) party['about'] = about;

        if (emails && emails.length > 0) {
            party['emailAddresses'] = emails.map((email: any) => ({
                type: email.type,
                address: email.address
            }));
        }

        if (phoneNumbers && phoneNumbers.length > 0) {
            party['phoneNumbers'] = phoneNumbers.map((phone: any) => ({
                type: phone.type,
                number: phone.number
            }));
        }

        if (addresses && addresses.length > 0) {
            party['addresses'] = addresses.map((addr: any) => ({
                type: addr.type,
                street: addr.street,
                city: addr.city,
                ...(addr.state && { state: addr.state }),
                ...(addr.country && { country: addr.country }),
                ...(addr.zip && { zip: addr.zip })
            }));
        }

        if (websites && websites.length > 0) {
            party['websites'] = websites.map((website: any) => ({
                type: website.type,
                url: website.url
            }));
        }

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/parties/${partyId}`,
            body: { party }
        });

        return response.body;
    },
});
