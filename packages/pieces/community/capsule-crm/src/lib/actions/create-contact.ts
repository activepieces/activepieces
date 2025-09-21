import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const createContact = createAction({
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new Person or Organisation contact',
    auth: capsuleAuth,
    props: {
        type: Property.StaticDropdown({
            displayName: 'Contact Type',
            description: 'Choose whether to create a person or organisation',
            required: true,
            options: {
                options: [
                    { label: 'Person', value: 'person' },
                    { label: 'Organisation', value: 'organisation' }
                ]
            }
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'First name (required for persons)',
            required: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Last name (required for persons)',
            required: false,
        }),
        organisationName: Property.ShortText({
            displayName: 'Organisation Name',
            description: 'Organisation name (required for organisations)',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'Job title or position',
            required: false,
        }),
        emails: Property.Array({
            displayName: 'Email Addresses',
            description: 'Email addresses for the contact',
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
            description: 'Phone numbers for the contact',
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
            description: 'Addresses for the contact',
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
            description: 'Website URLs for the contact',
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
            description: 'Additional information about the contact',
            required: false,
        })
    },
    async run(context) {
        const { type, firstName, lastName, organisationName, title, emails, phoneNumbers, addresses, websites, about } = context.propsValue;

        const party: Record<string, any> = {
            type: type
        };

        if (type === 'person') {
            if (!firstName || !lastName) {
                throw new Error('First name and last name are required for persons');
            }
            party['firstName'] = firstName;
            party['lastName'] = lastName;
            if (title) party['title'] = title;
        } else if (type === 'organisation') {
            if (!organisationName) {
                throw new Error('Organisation name is required for organisations');
            }
            party['name'] = organisationName;
        }

        if (about) party['about'] = about;

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
            method: HttpMethod.POST,
            resourceUri: '/parties',
            body: { party }
        });

        return response.body;
    },
});
