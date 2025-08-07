import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedriveCommon, // Assuming this is updated to handle v2 webhooks
    pipedrivePaginatedApiCall, // Assuming this is updated to handle v2 cursor-based pagination
    pipedriveTransformCustomFields, // Assuming this is updated to transform v2 custom field structure
} from '../common';
import { pipedriveAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetDealResponse, GetField, ListDealsResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Deal in v2
interface PipedriveDealV2 {
    id: number;
    title: string;
    creator_user_id: number; // No longer an object, just the ID
    owner_id: number; // Renamed from user_id, no longer an object, just the ID
    person_id: number | null; // No longer an object, just the ID
    org_id: number | null; // No longer an object, just the ID
    stage_id: number;
    pipeline_id: number;
    value: number;
    currency: string;
    add_time: string; // RFC 3339 format
    update_time: string; // RFC 3339 format
    stage_change_time: string; // RFC 3339 format
    is_deleted: boolean; // Replaces 'active' and 'deleted' flags, is negation of old 'active'
    status: 'open' | 'won' | 'lost';
    probability: number | null;
    lost_reason: string | null;
    visible_to: number; // Is an integer now
    close_time: string | null; // RFC 3339 format
    won_time: string | null; // RFC 3339 format
    first_won_time?: string; // RFC 3339 format, included only when using `include_fields` parameter
    lost_time: string | null; // RFC 3339 format
    products_count?: number; // Included only when using `include_fields` parameter
    files_count?: number; // Included only when using `include_fields` parameter
    notes_count?: number; // Included only when using `include_fields` parameter
    followers_count?: number; // Included only when using `include_fields` parameter
    email_messages_count?: number; // Included only when using `include_fields` parameter
    activities_count?: number; // Included only when using `include_fields` parameter
    done_activities_count?: number; // Included only when using `include_fields` parameter
    undone_activities_count?: number; // Included only when using `include_fields` parameter
    participants_count?: number; // Included only when using `include_fields` parameter
    expected_close_date: string | null; // YYYY-MM-DD
    last_incoming_mail_time?: string; // RFC 3339 format
    last_outgoing_mail_time?: string; // RFC 3339 format
    label_ids: number[]; // Replaces 'label' (array of IDs)
    rotten_time: string | null; // RFC 3339 format
    smart_bcc_email?: string; // Renamed from cc_email, included only when using `include_fields` parameter
    acv?: number;
    arr?: number;
    mrr?: number;
    custom_fields: Record<string, unknown>; // Custom fields are now nested here
    // Other optional fields from include_fields or removed fields are not explicitly defined here
}

// Update ListDealsResponse and GetDealResponse to reflect v2 structure
interface ListDealsResponseV2 {
    data: PipedriveDealV2[];
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

interface GetDealResponseV2 {
    data: PipedriveDealV2;
}

export const newDeal = createTrigger({
    auth: pipedriveAuth,
    name: 'new_deal',
    displayName: 'New Deal',
    description: 'Triggers when a new deal is created.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // Assuming pipedriveCommon.subscribeWebhook is already updated or will be updated
        // to correctly interact with Pipedrive's v2 webhook API.
        const webhook = await pipedriveCommon.subscribeWebhook(
            'deal',
            'added',
            context.webhookUrl!,
            context.auth.data['api_domain'],
            context.auth.access_token,
        );
        await context.store?.put<WebhookInformation>('_new_deal_trigger', {
            webhookId: webhook.data.id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>('_new_deal_trigger');
        if (response !== null && response !== undefined) {
            // Assuming pipedriveCommon.unsubscribeWebhook is already updated or will be updated
            // to correctly interact with Pipedrive's v2 webhook API.
            await pipedriveCommon.unsubscribeWebhook(
                response.webhookId,
                context.auth.data['api_domain'],
                context.auth.access_token,
            );
        }
    },
    async test(context) {
        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        const dealsResponse = await pipedriveApiCall<ListDealsResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals', // Updated to v2 endpoint
            query: {
                limit: 5,
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
            },
        });

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields', // Updated to v2 endpoint
        });

        if (isNil(dealsResponse.data)) {
            return [];
        }

        const result = [];

        for (const deal of dealsResponse.data) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
            result.push(updatedDealProperties);
        }

        return result;
    },
    async run(context) {
        const payloadBody = context.payload.body as PayloadBody;

        // IMPORTANT: Changed API version from v1 to v2
        const dealResponse = await pipedriveApiCall<GetDealResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/deals/${payloadBody.current.id}`, // Updated to v2 endpoint
        });

        // IMPORTANT: Changed API version from v1 to v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields', // Updated to v2 endpoint
        });

        // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
        const updatedDealProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            dealResponse.data,
        );

        return [updatedDealProperties];
    },
    sampleData: {
        id: 1,
        creator_user_id: 8877, // No longer an object, just the ID
        owner_id: 8877, // Renamed from user_id, no longer an object, just the ID
        person_id: 1101, // No longer an object, just the ID
        org_id: 5, // No longer an object, just the ID
        stage_id: 2,
        title: 'Deal One',
        value: 5000,
        currency: 'EUR',
        add_time: '2019-05-29T04:21:51Z', // RFC 3339 format
        update_time: '2019-11-28T16:19:50Z', // RFC 3339 format
        stage_change_time: '2019-11-28T15:41:22Z', // RFC 3339 format
        is_deleted: false, // Replaces 'active' and 'deleted' flags, negation of old 'active'
        status: 'open',
        probability: null,
        next_activity_id: 128, // Included only when using `include_fields` parameter
        last_activity_id: null, // Included only when using `include_fields` parameter
        lost_reason: null,
        visible_to: 1, // Is an integer now
        close_time: null, // RFC 3339 format
        pipeline_id: 1,
        won_time: '2019-11-27T11:40:36Z', // RFC 3339 format
        first_won_time: '2019-11-27T11:40:36Z', // RFC 3339 format, included only when using `include_fields` parameter
        lost_time: null, // RFC 3339 format (was empty string)
        products_count: 0, // Included only when using `include_fields` parameter
        files_count: 0, // Included only when using `include_fields` parameter
        notes_count: 2, // Included only when using `include_fields` parameter
        followers_count: 0, // Included only when using `include_fields` parameter
        email_messages_count: 4, // Included only when using `include_fields` parameter
        activities_count: 1, // Included only when using `include_fields` parameter
        done_activities_count: 0, // Included only when using `include_fields` parameter
        undone_activities_count: 1, // Included only when using `include_fields` parameter
        participants_count: 1, // Included only when using `include_fields` parameter
        expected_close_date: '2019-06-29',
        last_incoming_mail_time: '2019-05-29T18:21:42Z', // RFC 3339 format
        last_outgoing_mail_time: '2019-05-30T03:45:35Z', // RFC 3339 format
        label_ids: [11], // Replaced 'label' (single ID string) with 'label_ids' (array of numbers)
        rotten_time: null,
        smart_bcc_email: 'company+deal1@pipedrivemail.com', // Renamed from cc_email
        custom_fields: { // Example of nested custom fields in v2
            "d4de1c1518b4531717c676029a45911c340390a6": {
                "value": 2300,
                "currency": "EUR"
            }
        }
    },
});

interface WebhookInformation {
    webhookId: string;
}

type PayloadBody = {
    current: PipedriveDealV2; // Ensure 'current' matches the v2 deal object
    previous: PipedriveDealV2; // Webhooks often include 'previous' state too
    event: string;
    // Other webhook payload fields
};