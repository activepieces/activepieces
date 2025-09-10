import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const searchOpportunity = createAction({
    name: 'search_opportunity',
    auth: copperAuth,
    displayName: 'Search for Opportunity',
    description: 'Finds an existing opportunity by ID or other criteria.',
    props: {
        opportunity_id: Property.ShortText({
            displayName: 'Opportunity ID',
            description: "If provided, fetches a single opportunity by its ID and ignores other fields.",
            required: false,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Search for an opportunity by its name (exact match).",
            required: false,
        }),
        pipeline_id: copperProps.optionalPipelineId,
        pipeline_stage_id: copperProps.optionalPipelineStageId,
        primary_contact_id: copperProps.primaryContactId,
        company_id: copperProps.optionalCompanyId,
        assignee_id: copperProps.assigneeId,
    },
    async run(context) {
        const { opportunity_id, name, pipeline_id, pipeline_stage_id, primary_contact_id, company_id, assignee_id } = context.propsValue;
        const { token, email: authEmail } = context.auth;

        // Get by ID if provided
        if (opportunity_id) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `https://api.copper.com/developer_api/v1/opportunities/${opportunity_id}`,
                headers: {
                    'X-PW-AccessToken': token,
                    'X-PW-UserEmail': authEmail,
                    'X-PW-Application': 'developer_api',
                    'Content-Type': 'application/json',
                },
            });
            // Return as an array to maintain consistency with search results
            return [response.body];
        }

        // Otherwise, search
        const body: Record<string, unknown> = {};
        if (name) body['name'] = name;
        if (pipeline_id) body['pipeline_ids'] = [pipeline_id];
        if (pipeline_stage_id) body['pipeline_stage_ids'] = [pipeline_stage_id];
        if (primary_contact_id) body['primary_contact_ids'] = [primary_contact_id];
        if (company_id) body['company_ids'] = [company_id];
        if (assignee_id) body['assignee_ids'] = [assignee_id];

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/opportunities/search`,
            headers: {
                'X-PW-AccessToken': token,
                'X-PW-UserEmail': authEmail,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body,
        });

        return response.body;
    }
});