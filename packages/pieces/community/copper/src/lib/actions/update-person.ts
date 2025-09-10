import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const updatePerson = createAction({
    name: 'update_person',
    auth: copperAuth,
    displayName: 'Update Person',
    description: 'Updates a person based on matching criteria.',
    props: {
        person_id: copperProps.personId,
        name: Property.ShortText({
            displayName: 'Full Name',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: "The person's job title.",
            required: false,
        }),
        details: Property.LongText({
            displayName: 'Details',
            description: "Additional notes or description about the person.",
            required: false,
        })
        // You can add more optional fields here (e.g., email, phone_number, address)
        // just like in the 'create-person' action, but set 'required: false'.
    },
    async run(context) {
        const { person_id, ...updatedFields } = context.propsValue;

        const body: Record<string, unknown> = {};

        // Add only the fields that the user has provided
        for (const [key, value] of Object.entries(updatedFields)) {
            if (value !== undefined && value !== '') {
                body[key] = value;
            }
        }
        
        // If no fields were provided to update, we don't need to make an API call.
        if (Object.keys(body).length === 0) {
            return { success: true, message: "No fields were provided to update." };
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.copper.com/developer_api/v1/people/${person_id}`,
            headers: {
                'X-PW-AccessToken': context.auth.token,
                'X-PW-UserEmail': context.auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body
        });

        return response.body;
    }
});