import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, LeadListResponse } from '../common/types'; // LeadListResponse will be updated below
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Lead in v2
interface PipedriveLeadV2 {
    id: string; // Lead IDs are UUIDs
    title: string;
    owner_id: number; // No longer an object, just the ID
    creator_id: number; // No longer an object, just the ID
    label_ids: string[]; // Array of string UUIDs for labels
    value: number | null;
    expected_close_date: string | null; // YYYY-MM-DD
    person_id: number | null; // No longer an object, just the ID
    organization_id: number | null; // No longer an object, just the ID
    is_archived: boolean;
    source_name: string;
    origin: string;
    origin_id: string | null;
    channel: number | null;
    channel_id: string | null;
    was_seen: boolean;
    next_activity_id: number | null;
    add_time: string; // RFC 3339 format
    update_time: string; // RFC 3339 format
    visible_to: number; // Is an integer now (e.g., 1, 3, 5, 7)
    custom_fields?: Record<string, unknown>; // Custom fields are now nested here
    // Other optional fields from include_fields or removed fields are not explicitly defined here
}

// Update LeadListResponse to reflect v2 structure
interface LeadListResponseV2 {
    data: PipedriveLeadV2[];
    // Include pagination and additional_data if present in the actual response
    additional_data?: {
        pagination?: {
            start: number;
            limit: number;
            more_items_in_collection: boolean;
            next_cursor?: string; // v2 uses cursor-based pagination
        };
    };
}

interface GetLeadResponseV2 {
    data: PipedriveLeadV2;
}

export const newLeadTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'new-lead',
    displayName: 'New Lead',
    description: 'Triggers when a new lead is created.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // IMPORTANT: Changed API version from v1 to v2 for webhooks
        const response = await httpClient.sendRequest<{ data: { id: string } }>({
            method: HttpMethod.POST,
            url: `${context.auth.data['api_domain']}/api/v2/webhooks`, // Updated to v2 endpoint
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            body: {
                event_object: 'lead',
                event_action: 'added', // Changed from 'create' to 'added' for consistency with Pipedrive's webhook events
                subscription_url: context.webhookUrl,
                version: '2.0',
            },
        });

        await context.store?.put<{
            webhookId: string;
        }>('_new_lead_trigger', {
            webhookId: response.body.data.id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<{
            webhookId: string;
        }>('_new_lead_trigger');
        if (response !== null && !isNil(response.webhookId)) {
            // IMPORTANT: Changed API version from v1 to v2 for webhooks
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `${context.auth.data['api_domain']}/api/v2/webhooks/${response.webhookId}`, // Updated to v2 endpoint
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: context.auth.access_token,
                },
            });
        }
    },
    async test(context) {
        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        const response = await pipedriveApiCall<LeadListResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/leads', // Updated to v2 endpoint
            query: {
                limit: 10,
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
            },
        });

        if (isNil(response.data)) {
            return [];
        }
        // IMPORTANT: Changed resourceUri for custom fields from /dealFields to /leadFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/leadFields', // Updated to v2 endpoint for lead fields
        });

        const result = [];

        for (const lead of response.data) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedLeadProperties = pipedriveTransformCustomFields(customFieldsResponse, lead);
            result.push(updatedLeadProperties);
        }

        return result;
    },
    async run(context) {
        const payloadBody = context.payload.body as {
            data: PipedriveLeadV2; // Ensure 'data' matches the v2 lead object
            previous: PipedriveLeadV2; // Webhooks often include 'previous' state too
            event: string;
            // Other webhook payload fields
        };

        // IMPORTANT: Changed API version from v1 to v2
        const leadResponse = await pipedriveApiCall<GetLeadResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/leads/${payloadBody.data.id}`, // Updated to v2 endpoint
        });

        // IMPORTANT: Changed resourceUri for custom fields from /dealFields to /leadFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/leadFields', // Updated to v2 endpoint for lead fields
        });

        // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
        const updatedLeadProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            leadResponse.data,
        );

        return [updatedLeadProperties];
    },
    sampleData: {
        id: 'f3c23480-c9b1-11ef-bc83-2b8218e028ef',
        title: 'Test lead',
        owner_id: 22701301, // No longer an object, just the ID
        creator_id: 22701301, // No longer an object, just the ID
        label_ids: ['a0e5f330-d2a7-4181-a6e3-a44d634b7bf7', '8a0e6918-1eee-4e56-a615-c81d712a6a77'],
        value: null,
        expected_close_date: null,
        person_id: 2, // No longer an object, just the ID
        organization_id: 1, // No longer an object, just the ID
        is_archived: false,
        source_name: 'Manually created',
        origin: 'ManuallyCreated',
        origin_id: null,
        channel: 1,
        channel_id: null,
        was_seen: true,
        next_activity_id: null,
        add_time: '2025-01-03T09:06:00.776Z', // RFC 3339 format
        update_time: '2025-01-03T09:06:00.776Z', // RFC 3339 format
        visible_to: 3, // Is an integer now
        custom_fields: { // Placeholder for custom fields in v2
            "your_custom_field_key": "your_custom_field_value"
        }
    },
});