import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { organisationDropdown } from '../common/props';

export const createContact = createAction({
    auth: capsuleCrmAuth,
    name: 'create_contact',
    displayName: 'Create Contact',
    description: 'Create a new Person or Organisation.',
    props: {
        type: Property.StaticDropdown({
            displayName: 'Contact Type',
            description: 'The type of contact to create.',
            required: true,
            options: {
                options: [
                    { label: 'Person', value: 'person' },
                    { label: 'Organisation', value: 'organisation' },
                ]
            }
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: "Set the contact's first name. (Used for 'Person' type).",
            required: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: "Set the contact's last name. (Required for 'Person' type).",
            required: false,
        }),
        jobTitle: Property.ShortText({
            displayName: 'Job Title',
            description: "Set the contact's job title. (Used for 'Person' type).",
            required: false,
        }),
        organisationId: organisationDropdown,
        name: Property.ShortText({
            displayName: 'Organisation Name',
            description: "The name of the organisation. (Required for 'Organisation' type).",
            required: false,
        }),
        // --- Common Fields ---
        about: Property.LongText({
            displayName: 'About',
            description: 'A description for the contact.',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: "The contact's primary email address.",
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone Number',
            description: "The contact's primary phone number.",
            required: false,
        }),
        website: Property.ShortText({
            displayName: 'Website URL',
            description: "The contact's website URL.",
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;

        const partyPayload: { [key: string]: any } = {
            type: propsValue.type,
            about: propsValue.about,
        };

        if (propsValue.type === 'person') {
            if (!propsValue.lastName) {
                throw new Error("Last Name is required when creating a 'Person'.");
            }
            partyPayload['firstName'] = propsValue.firstName;
            partyPayload['lastName'] = propsValue.lastName;
            partyPayload['jobTitle'] = propsValue.jobTitle;
            if (propsValue.organisationId) {
                partyPayload['organisation'] = { id: propsValue.organisationId };
            }
        } else { 
            if (!propsValue.name) {
                throw new Error("Organisation Name is required when creating an 'Organisation'.");
            }
            partyPayload['name'] = propsValue.name;
        }

        if (propsValue.email) {
            partyPayload['emailAddresses'] = [{ type: 'Work', address: propsValue.email }];
        }
        if (propsValue.phone) {
            partyPayload['phoneNumbers'] = [{ number: propsValue.phone }];
        }
        if (propsValue.website) {
            partyPayload['websites'] = [{ service: 'URL', address: propsValue.website }];
        }

        const response = await makeRequest(
            auth,
            HttpMethod.POST,
            '/parties',
            { party: partyPayload }
        );

        return response;
    },
});