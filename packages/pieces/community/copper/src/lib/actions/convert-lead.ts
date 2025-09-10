import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const convertLead = createAction({
    name: 'convert_lead',
    auth: copperAuth,
    displayName: 'Convert Lead to Person',
    description: 'Converts a lead into a person, optionally creating a company and opportunity.',
    props: {
        lead_id: copperProps.leadId,
        person_name: Property.ShortText({
            displayName: "New Person's Name",
            description: "The full name for the new Person record that will be created.",
            required: true,
        }),
        company_name: Property.ShortText({
            displayName: 'Company Name',
            description: "If provided, links to an existing company or creates a new one.",
            required: false,
        }),
        opportunity_name: Property.ShortText({
            displayName: "Opportunity Name",
            description: "If provided, a new opportunity will be created.",
            required: false,
        }),
        pipeline_id: copperProps.pipelineId,
        pipeline_stage_id: copperProps.pipelineStageId,
        monetary_value: Property.Number({
            displayName: 'Monetary Value',
            description: "The value of the opportunity (e.g., 1000 for $10).",
            required: false,
        }),
    },
    async run(context) {
        const { lead_id, person_name, company_name, opportunity_name, pipeline_id, pipeline_stage_id, monetary_value } = context.propsValue;

        const details: Record<string, unknown> = {
            person: { name: person_name },
        };

        if (company_name) {
            details['company'] = { name: company_name };
        }

        if (opportunity_name) {
            const opportunity: Record<string, unknown> = { name: opportunity_name };
            if (pipeline_id) opportunity['pipeline_id'] = pipeline_id;
            if (pipeline_stage_id) opportunity['pipeline_stage_id'] = pipeline_stage_id;
            if (monetary_value) opportunity['monetary_value'] = monetary_value;
            details['opportunity'] = opportunity;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/leads/${lead_id}/convert`,
            headers: {
                'X-PW-AccessToken': context.auth.token,
                'X-PW-UserEmail': context.auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: { details }
        });

        return response.body;
    }
});