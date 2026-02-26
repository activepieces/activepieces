import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { klaviyoAuth } from "../../index";

export const createProfile = createAction({
    auth: klaviyoAuth,
    name: 'create_profile',
    displayName: 'Create Profile',
    description: 'Create a new profile in Klaviyo.',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            required: false,
        }),
        external_id: Property.ShortText({
            displayName: 'External ID',
            required: false,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        organization: Property.ShortText({
            displayName: 'Organization',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            required: false,
        }),
        image: Property.ShortText({
            displayName: 'Image URL',
            required: false,
        }),
        location: Property.Object({
            displayName: 'Location',
            required: false,
        }),
        properties: Property.Object({
            displayName: 'Custom Properties',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        
        const attributes: Record<string, any> = {
            email: propsValue.email,
            phone_number: propsValue.phone_number,
            external_id: propsValue.external_id,
            first_name: propsValue.first_name,
            last_name: propsValue.last_name,
            organization: propsValue.organization,
            title: propsValue.title,
            image: propsValue.image,
            location: propsValue.location,
            properties: propsValue.properties,
        };

        // Remove undefined or empty string values
        Object.keys(attributes).forEach(key => {
            if (attributes[key] === undefined || attributes[key] === '') {
                delete attributes[key];
            }
        });

        const body = {
            data: {
                type: 'profile',
                attributes
            }
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://a.klaviyo.com/api/profiles/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${auth.secret_text}`,
                'Revision': '2024-10-15',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body,
        });

        return response.body;
    },
});
