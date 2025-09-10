import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const updateCompany = createAction({
    name: 'update_company',
    auth: copperAuth,
    displayName: 'Update Company',
    description: 'Updates a company record.',
    props: {
        company_id: copperProps.companyId,
        name: Property.ShortText({
            displayName: 'Company Name',
            required: false,
        }),
        primary_contact_id: copperProps.primaryContactId,
        email_domain: Property.ShortText({
            displayName: "Email Domain",
            required: false,
        }),
        details: Property.LongText({
            displayName: 'Details',
            required: false,
        })
    },
    async run(context) {
        const { company_id, ...updatedFields } = context.propsValue;

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
            url: `https://api.copper.com/developer_api/v1/companies/${company_id}`,
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