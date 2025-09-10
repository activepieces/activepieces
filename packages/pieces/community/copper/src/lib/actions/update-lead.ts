import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const updateLead = createAction({
    name: 'update_lead',
    auth: copperAuth,
    displayName: 'Update Lead',
    description: 'Updates an existing lead.',
    props: {
        lead_id: copperProps.leadId,
        name: Property.ShortText({
            displayName: 'Lead Name',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: "The lead's job title.",
            required: false,
        }),
        customer_source_id: copperProps.customerSourceId,
        details: Property.LongText({
            displayName: 'Details',
            description: 'Additional notes or description about the lead.',
            required: false,
        })
    },
    async run(context) {
        const { lead_id, ...updatedFields } = context.propsValue;

        const body: Record<string, unknown> = {};

        // Add only the fields that the user has provided
        for (const [key, value] of Object.entries(updatedFields)) {
            if (value !== undefined && value !== null && value !== '') {
                body[key] = value;
            }
        }
        
        if (Object.keys(body).length === 0) {
            return { success: true, message: "No fields were provided to update." };
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.copper.com/developer_api/v1/leads/${lead_id}`,
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