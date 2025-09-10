import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const updateOpportunity = createAction({
    name: 'update_opportunity',
    auth: copperAuth,
    displayName: 'Update Opportunity',
    description: 'Updates an opportunity using match criteria.',
    props: {
        opportunity_id: copperProps.opportunityId,
        name: Property.ShortText({
            displayName: 'Opportunity Name',
            required: false,
        }),
        pipeline_id: copperProps.optionalPipelineId,
        pipeline_stage_id: copperProps.optionalPipelineStageId,
        primary_contact_id: copperProps.primaryContactId,
        company_id: copperProps.optionalCompanyId,
        monetary_value: Property.Number({
            displayName: 'Monetary Value',
            required: false,
        }),
        details: Property.LongText({
            displayName: 'Details',
            required: false,
        })
    },
    async run(context) {
        const { opportunity_id, ...updatedFields } = context.propsValue;

        const body: Record<string, unknown> = {};

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
            url: `https://api.copper.com/developer_api/v1/opportunities/${opportunity_id}`,
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