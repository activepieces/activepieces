

import { createAction, Property, DynamicPropsValue, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { uscreenAuth } from "../common/auth";
import { uscreenApiUrl } from "../common/client"; 


interface CreateUserProps {
    email: string;
    first_name: string;
    last_name: string;
    password?: string;
    send_invite_email?: boolean;
    custom_fields?: DynamicPropsValue;
}

export const createUser = createAction({
    auth: uscreenAuth,
    name: 'create_user',
    displayName: 'Create User',
    description: "Creates a new user and optionally sends them a welcome email.",

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
        send_invite_email: Property.Checkbox({
            displayName: 'Send Invite Email',
            description: 'If set to true, the new user will receive a welcome email automatically.',
            required: false,
            defaultValue: false,
        }),
        custom_fields: Property.DynamicProperties({
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
            send_invite_email, 
            custom_fields 
        } = context.propsValue as CreateUserProps;

        const body: Record<string, unknown> = { ...custom_fields };
        
        delete body['add_field_helper'];

        body['email'] = email;
        body['first_name'] = first_name;
        body['last_name'] = last_name;

        if (password) {
            body['password'] = password;
        }
        if (send_invite_email) {
            body['send_invite_email'] = send_invite_email;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${uscreenApiUrl}/customer`,
            body: body,
            headers: {
                'X-Store-Token': context.auth as string,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return response.body;
    },
});