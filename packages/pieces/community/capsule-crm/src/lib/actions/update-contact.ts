import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyDropdown } from '../common/props';

export const updateContact = createAction({
    auth: capsuleCrmAuth,
    name: 'update_contact',
    displayName: 'Update Contact',
    description: 'Update fields on an existing Contact.',
    props: {
        partyId: partyDropdown,
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: "Update the contact's first name (for 'Person' type). Leave blank to keep current value.",
            required: false,
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: "Update the contact's last name (for 'Person' type). Leave blank to keep current value.",
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Organisation Name',
            description: "Update the organisation's name (for 'Organisation' type). Leave blank to keep current value.",
            required: false,
        }),
        jobTitle: Property.ShortText({
            displayName: 'Job Title',
            description: "Update the contact's job title (for 'Person' type). Leave blank to keep current value.",
            required: false,
        }),
        about: Property.LongText({
            displayName: 'About',
            description: 'Update the description for the contact. Leave blank to keep current value.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { partyId, firstName, lastName, name, jobTitle, about } = propsValue;

        const partyPayload: { [key: string]: any } = {};

       
        if (firstName) partyPayload['firstName'] = firstName;
        if (lastName) partyPayload['lastName'] = lastName;
        if (name) partyPayload['name'] = name;
        if (jobTitle) partyPayload['jobTitle'] = jobTitle;
        if (about) partyPayload['about'] = about;

       
        if (Object.keys(partyPayload).length === 0) {
            return { success: true, message: "No fields provided to update." };
        }

        const response = await makeRequest(
            auth,
            HttpMethod.PUT,
            `/parties/${partyId}`,
            { party: partyPayload }
        );

        return response;
    },
});