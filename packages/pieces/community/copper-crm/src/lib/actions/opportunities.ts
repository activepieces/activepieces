import { createAction, Property } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { opportunityCustomFields, opportunityTags, opportunityWinProbability, opportunityStatus, opportunityPipelineStageId, opportunityPriority, opportunityPrimaryContactId, opportunityLossReasonId, opportunityDetails, opportunityCustomerSourceId, opportunityCompanyName, opportunityCompanyId, opportunityAssigneeId, opportunityCloseDate, opportunityName, opportunityMonetaryValue, opportunityPipelineId, opportunityId } from "../common/opportunity";
import { makeCopperRequest } from "../common/request";
import { HttpMethod } from "@activepieces/pieces-common";
import { OPPORTUNITIES_API_ENDPOINT } from "../common/constants";

export const createOpportunity = createAction({
    auth: copperAuth,
    name: 'create_opportunity',
    displayName: 'Create Opportunity',
    description: 'Create a new Opportunity in Copper.',
    props: {
        name: opportunityName,
        primary_contact_id: opportunityPrimaryContactId,
        assignee_id: opportunityAssigneeId,
        close_date: opportunityCloseDate,
        company_id: opportunityCompanyId,
        company_name: opportunityCompanyName,
        customer_source_id: opportunityCustomerSourceId,
        details: opportunityDetails,
        loss_reason_id: opportunityLossReasonId,
        monetary_value: opportunityMonetaryValue,
        pipeline_id: opportunityPipelineId,
        priority: opportunityPriority,
        pipeline_stage_id: opportunityPipelineStageId,
        status: opportunityStatus,
        tags: opportunityTags,
        win_probability: opportunityWinProbability,
        custom_fields: opportunityCustomFields,
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { name, primary_contact_id, ...optionalProps } = propsValue;

        const activeOptionalProps = Object.fromEntries(
            Object.entries(optionalProps).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                return value != null;
            })
        );

        const payload = {
            name,
            primary_contact_id,
            ...activeOptionalProps,
        };

        return await makeCopperRequest(
            HttpMethod.POST,
            OPPORTUNITIES_API_ENDPOINT,
            auth,
            payload
        );
    },
});

export const updateOpportunity = createAction({
    auth: copperAuth,
    name: 'update_opportunity',
    displayName: 'Update Opportunity',
    description: 'Update an existing Opportunity in Copper.',
    props: {
        id: opportunityId,
        name: { ...opportunityName, required: false },
        assignee_id: opportunityAssigneeId,
        close_date: opportunityCloseDate,
        company_id: opportunityCompanyId,
        company_name: opportunityCompanyName,
        customer_source_id: opportunityCustomerSourceId,
        details: opportunityDetails,
        loss_reason_id: opportunityLossReasonId,
        monetary_value: opportunityMonetaryValue,
        pipeline_id: opportunityPipelineId,
        primary_contact_id: { ...opportunityPrimaryContactId, required: false },
        priority: opportunityPriority,
        pipeline_stage_id: opportunityPipelineStageId,
        status: opportunityStatus,
        tags: opportunityTags,
        win_probability: opportunityWinProbability,
        custom_fields: opportunityCustomFields,
    },
    async run(context) {
        const { id, ...optionalProps } = context.propsValue;

        const payload = Object.fromEntries(
            Object.entries(optionalProps).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                return value != null;
            })
        );

        return await makeCopperRequest(
            HttpMethod.PUT,
            `${OPPORTUNITIES_API_ENDPOINT}/${id}`,
            context.auth,
            payload
        );
    },
});

export const searchOpportunity = createAction({
    auth: copperAuth,
    name: 'search_opportunity',
    displayName: 'Search Opportunity',
    description: 'Find an opportunity and return the first matching result based on provided filters.',
    props: {
        // --- Basic Search Filters (now simplified) ---
        id: opportunityId,
        name: { ...opportunityName, required: false },
        assignee_id: { ...opportunityAssigneeId, required: false },
        company_id: { ...opportunityCompanyId, required: false },
        primary_contact_id: { ...opportunityPrimaryContactId, required: false },
        customer_source_id: { ...opportunityCustomerSourceId, required: false },
        loss_reason_id: { ...opportunityLossReasonId, required: false },
        pipeline_id: { ...opportunityPipelineId, required: false },
        pipeline_stage_id: { ...opportunityPipelineStageId, required: false },
        status: { ...opportunityStatus, required: false },
        priority: { ...opportunityPriority, required: false },
        tags: {
            ...opportunityTags,
            displayName: 'Tags (Match Any)',
            description: 'Opportunities matching at least one of the specified tags will be returned.',
            required: false,
        },

        // --- Value & Date Range Filters ---
        minimum_monetary_value: {
            ...opportunityMonetaryValue,
            displayName: 'Minimum Monetary Value',
            description: 'The minimum monetary value an Opportunity must have.',
            required: false,
        },
        maximum_monetary_value: {
            ...opportunityMonetaryValue,
            displayName: 'Maximum Monetary Value',
            description: 'The maximum monetary value an Opportunity must have.',
            required: false,
        },
        minimum_close_date: {
            ...opportunityCloseDate,
            displayName: 'Minimum Close Date',
            description: 'The earliest expected close date of the Opportunity.',
            required: false,
        },
        maximum_close_date: {
            ...opportunityCloseDate,
            displayName: 'Maximum Close Date',
            description: 'The latest expected close date of the Opportunity.',
            required: false,
        },

        // --- Custom Fields Search ---
        custom_fields: { ...opportunityCustomFields, required: false },
    },
    async run(context) {
        const { auth, propsValue } = context;

        const searchFilters: Record<string, any> = {
            ids: propsValue.id != null ? [propsValue.id] : undefined,
            name: propsValue.name,
            assignee_ids: propsValue.assignee_id != null ? [propsValue.assignee_id] : undefined,
            company_ids: propsValue.company_id != null ? [propsValue.company_id] : undefined,
            primary_contact_ids: propsValue.primary_contact_id != null ? [propsValue.primary_contact_id] : undefined,
            customer_source_ids: propsValue.customer_source_id != null ? [propsValue.customer_source_id] : undefined,
            loss_reason_ids: propsValue.loss_reason_id != null ? [propsValue.loss_reason_id] : undefined,
            pipeline_ids: propsValue.pipeline_id != null ? [propsValue.pipeline_id] : undefined,
            pipeline_stage_ids: propsValue.pipeline_stage_id != null ? [propsValue.pipeline_stage_id] : undefined,
            statuses: propsValue.status ? [propsValue.status] : undefined,
            priorities: propsValue.priority ? [propsValue.priority] : undefined,
            tags: Array.isArray(propsValue.tags) && propsValue.tags.length > 0
                ? { option: "ANY", value: propsValue.tags }
                : undefined,
            minimum_monetary_value: propsValue.minimum_monetary_value,
            maximum_monetary_value: propsValue.maximum_monetary_value,
            minimum_close_date: propsValue.minimum_close_date ? Math.floor(new Date(propsValue.minimum_close_date).getTime() / 1000) : undefined,
            maximum_close_date: propsValue.maximum_close_date ? Math.floor(new Date(propsValue.maximum_close_date).getTime() / 1000) : undefined,
            custom_fields: Array.isArray(propsValue.custom_fields) && propsValue.custom_fields.length > 0
                ? propsValue.custom_fields
                : undefined,
        };

        const activeFilters = Object.fromEntries(
            Object.entries(searchFilters).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'object' && value !== null) {
                    if ('option' in value && Array.isArray(value.value)) {
                        return value.value.length > 0;
                    }
                    return Object.keys(value).length > 0;
                }
                return value != null;
            })
        );

        const payload = {
            page_size: 1,
            ...activeFilters,
        };

        const response = await makeCopperRequest<any[]>(
            HttpMethod.POST,
            `${OPPORTUNITIES_API_ENDPOINT}/search`,
            auth,
            payload
        );

        return response?.[0] ?? null;
    },
});