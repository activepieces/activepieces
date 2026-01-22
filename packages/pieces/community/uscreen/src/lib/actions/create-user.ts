

import { createAction, Property, DynamicPropsValue, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { uscreenAuth } from "../common/auth";
import { uscreenApiUrl, UscreenClient } from "../common/client"; 


interface CreateUserProps {
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    opted_in_for_news_and_updates?: boolean;
    custom_fields?: DynamicPropsValue;
}

export const createUser = createAction({
    auth: uscreenAuth,
    name: 'create_user',
    displayName: 'Create User',
    description: "Creates a new user and optionally sends them a welcome email to your storefront.",

    props: {
        email: Property.ShortText({
            displayName: 'Email Address',
            description: "The new user's email address.",
            required: true,
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            description: "The new user's first name.",
            required: true,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            description: "The new user's last name.",
            required: true,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: "The new user's password. Leave blank if sending an invite email.",
            required: false,
        }),
        opted_in_for_news_and_updates: Property.Checkbox({
            displayName: 'Opted in for News and Updates',
            description: 'If set to true, the new user will receive news and updates.',
            required: false,
            defaultValue: true,
        }),
        custom_fields: Property.DynamicProperties({
            auth: uscreenAuth,
            displayName: 'Custom Fields',
            description: 'Add custom user fields defined in your storefront (e.g., "favorite_genre").',
            required: false,
            refreshers: [],
            props: async () => {
                const fields: DynamicPropsValue = {};
                fields['add_field_helper'] = Property.ShortText({
                    displayName: "Custom Field Instructions",
                    description: "Click 'Add Property' to add a custom field. Use the 'Property Name' as the API key (e.g., 'favorite_genre') and enter the value below.",
                    required: false,
                });
                return fields;
            }
        })
    },

    async run(context) {
        const { 
            email, 
            first_name, 
            last_name, 
            password, 
            opted_in_for_news_and_updates, 
            custom_fields 
        } = context.propsValue as CreateUserProps;
        const client = new UscreenClient(context.auth.secret_text);
        const body: Record<string, unknown> = { ...custom_fields };
        
        delete body['add_field_helper'];

        body['email'] = email;
        body['name'] = first_name + ' ' + last_name;
        
        if (password) {
            body['password'] = password;
        }
        if (opted_in_for_news_and_updates) {
            body['opted_in_for_news_and_updates'] = opted_in_for_news_and_updates;
        }

        const response = await client.makeRequest(
            HttpMethod.POST,
            `/customers`,
            body
        );

        return response;
    },
});