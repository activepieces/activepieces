import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common"; // <--- ADDED IMPORT
import { klaviyoAuth } from "../../index";
import { klaviyoCommon } from "../common";

export const createProfileAction = createAction({
    auth: klaviyoAuth,
    name: 'create_profile',
    displayName: 'Create Profile',
    description: 'Creates a new profile in Klaviyo (V3 API)',
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the profile',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            description: 'E.g. +15005550006',
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
        image: Property.ShortText({
            displayName: 'Image URL',
            required: false,
        })
    },
    async run(context) {
        const { email, phone_number, first_name, last_name, image } = context.propsValue;

        if (!email && !phone_number) {
            throw new Error("You must provide either an Email or a Phone Number to create a profile.");
        }

        const body = {
            data: {
                type: "profile",
                attributes: {
                    email: email || undefined,
                    phone_number: phone_number || undefined,
                    first_name: first_name || undefined,
                    last_name: last_name || undefined,
                    image: image || undefined
                }
            }
        };

        // CHANGED "POST" TO HttpMethod.POST
        return await klaviyoCommon.makeRequest(HttpMethod.POST, "/profiles", context.auth, body);
    }
});