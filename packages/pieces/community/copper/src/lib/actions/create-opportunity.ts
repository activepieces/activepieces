import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const createOpportunity = createAction({
    name: 'create_opportunity',
    auth: copperAuth,
    displayName: 'Create Opportunity',
    description: 'Adds a new opportunity.',
    props: {
        name: Property.ShortText({
            displayName: 'Opportunity Name',
            required: true,
        }),
        pipeline_id: copperProps.pipelineId,
        pipeline_stage_id: copperProps.pipelineStageId,
        primary_contact_id: copperProps.primaryContactId,
        company_id: copperProps.optionalCompanyId,
        monetary_value: Property.Number({
            displayName: 'Monetary Value',
            description: "The value of the opportunity (e.g., 1000 for $10).",
            required: false,
        }),
        customer_source_id: copperProps.customerSourceId,
        details: Property.LongText({
            displayName: 'Details',
            required: false,
        })
    },
    async run(context) {
        const body = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/opportunities`,
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