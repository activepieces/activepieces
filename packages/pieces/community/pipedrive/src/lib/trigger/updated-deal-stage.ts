import { pipedriveAuth } from '../../index';
import {
    createTrigger,
    DropdownOption,
    PiecePropValueSchema,
    Property,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import {
    GetField,
    RequestParams,
    WebhookCreateResponse,
} from '../common/types'; // GetDealResponse and ListDealsResponse will be replaced
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Deal in v2 (reused from new-deal.ts)
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
    activities_count?: number;
    done_activities_count?: number;
    undone_activities_count?: number;
    participants_count?: number;
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
}

// Define the structure for a Pipedrive Stage in v2
interface PipedriveStageV2 {
    id: number;
    order_nr: number;
    name: string;
    is_deleted: boolean; // replaces "active_flag". NB: Negation of the old value.
    deal_probability: number;
    pipeline_id: number;
    is_deal_rot_enabled: boolean; // replaces "rotten_flag"
    days_to_rotten: number | null; // replaces "rotten_days"
    add_time: string; // RFC 3339 format
    update_time: string | null; // RFC 3339 format
    // pipeline_name and pipeline_deal_probability fields have been removed from the Stage Object directly.
}

interface ListDealsResponseV2 {
    data: PipedriveDealV2[];
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

export const updatedDealStageTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'updated-deal-stage',
    displayName: 'Updated Deal Stage',
    description: "Triggers when a deal's stage is updated (using Pipedrive API v2).", // Updated description
    type: TriggerStrategy.WEBHOOK,
    props: {
        stage_id: Property.Dropdown({
            displayName: 'Stage in Pipeline',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        placeholder: 'please connect your account.',
                        disabled: true,
                        options: [],
                    };
                }

                const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
                // IMPORTANT: Changed API version from v1 to v2 for stages
                const response = await pipedrivePaginatedApiCall<PipedriveStageV2>({
                    accessToken: authValue.access_token,
                    apiDomain: authValue.data['api_domain'],
                    method: HttpMethod.GET,
                    resourceUri: '/v2/stages', // Updated to v2 endpoint
                });

                const options: DropdownOption<number>[] = [];
                for (const stage of response) {
                    // In v2, pipeline_name is no longer directly available on the stage object.
                    // To get pipeline name, a separate API call to /v2/pipelines/{pipeline_id} would be needed.
                    // For simplicity in dropdown, we'll just use stage name.
                    options.push({
                        label: `${stage.name}`, // Removed pipeline_name from label
                        value: stage.id,
                    });
                }

                return {
                    disabled: false,
                    options,
                };
            },
        }),
    },
    async onEnable(context) {
        // IMPORTANT: Changed API version from v1 to v2 for webhooks
        const response = await pipedriveApiCall<WebhookCreateResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/webhooks', // Updated to v2 endpoint
            body: {
                subscription_url: context.webhookUrl,
                event_object: 'deal',
                event_action: 'updated',
                version: '2.0', // Updated webhook version to 2.0
            },
        });

        // FIX: Change type to string as webhook IDs are UUIDs (strings) in v2
        await context.store.put<string>('updated-deal-stage-trigger', response.data.id);
    },
    async onDisable(context) {
        // FIX: Change type to string as webhook IDs are UUIDs (strings) in v2
        const webhook = await context.store.get<string>('updated-deal-stage-trigger');
        if (webhook) {
            // IMPORTANT: Changed API version from v1 to v2 for webhooks
            await pipedriveApiCall<WebhookCreateResponse>({
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.DELETE,
                resourceUri: `/v2/webhooks/${webhook}`, // Updated to v2 endpoint
            });
        }
    },
    async test(context) {
        const stageId = context.propsValue.stage_id;

        const qs: RequestParams = {
            limit: 10,
            sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
            sort_direction: 'desc', // Added 'sort_direction'
        };

        if (stageId) {
            qs['stage_id'] = stageId.toString();
        }

        // IMPORTANT: Changed API version from v1 to v2 for deals
        const dealsResponse = await pipedriveApiCall<ListDealsResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals', // Updated to v2 endpoint
            query: qs,
        });

        if (isNil(dealsResponse.data)) {
            return [];
        }

        // IMPORTANT: Changed resourceUri for custom fields to /dealFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields', // Updated to v2 endpoint
        });

        const result = [];

        for (const deal of dealsResponse.data) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);

            // IMPORTANT: Changed API version from v1 to v2 for stages
            const stageResponse = await pipedriveApiCall<{ data: PipedriveStageV2 }>({ // Expected v2 Stage object
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `/v2/stages/${updatedDealProperties.stage_id}`, // Updated to v2 endpoint
            });

            updatedDealProperties['stage'] = stageResponse.data;
            result.push(updatedDealProperties);
        }

        return result;
    },
    async run(context) {
        const stageId = context.propsValue.stage_id;

        const payloadBody = context.payload.body as PayloadBody;
        const currentDealData = payloadBody.current;
        const previousDealData = payloadBody.previous;

        if (currentDealData.stage_id !== previousDealData.stage_id) {

            if (stageId && currentDealData.stage_id !== stageId) {
                return [];
            }

            // IMPORTANT: Changed API version from v1 to v2 for deals
            const dealResponse = await pipedriveApiCall<GetDealResponseV2>({
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `/v2/deals/${payloadBody.current.id}`, // Updated to v2 endpoint
            });

            // IMPORTANT: Changed resourceUri for custom fields to /dealFields
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

            // IMPORTANT: Changed API version from v1 to v2 for stages
            const stageResponse = await pipedriveApiCall<{ data: PipedriveStageV2 }>({ // Expected v2 Stage object
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `/v2/stages/${currentDealData.stage_id}`, // Updated to v2 endpoint
            });

            updatedDealProperties['stage'] = stageResponse.data;

            return [updatedDealProperties];
        }
        return [];
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
        lost_time: null, // RFC 3339 format
        products_count: 0, // Included only when using `include_fields` parameter
        files_count: 0, // Included only when using `include_fields` parameter
        notes_count: 2, // Included only when using `include_fields` parameter
        followers_count: 0, // Included only when using `include_fields` parameter
        email_messages_count: 4, // Included only when using `include_fields` parameter
        activities_count: 1,
        done_activities_count: 0,
        undone_activities_count: 1,
        participants_count: 1,
        expected_close_date: '2019-06-29',
        last_incoming_mail_time: '2019-05-29T18:21:42Z', // RFC 3339 format
        last_outgoing_mail_time: '2019-05-30T03:45:35Z', // RFC 3339 format
        label_ids: [11], // Replaces 'label' (array of numbers)
        rotten_time: null,
        smart_bcc_email: 'company+deal1@pipedrivemail.com', // Renamed from cc_email
        custom_fields: { // Example of nested custom fields in v2
            "d4de1c1518b4531717c676029a45911c340390a6": {
                "value": 2300,
                "currency": "EUR"
            }
        },
        stage: { // Nested stage object, reflecting v2 Stage Object
            id: 2,
            order_nr: 1,
            name: 'Qualification',
            is_deleted: false,
            deal_probability: 100,
            pipeline_id: 1,
            is_deal_rot_enabled: false,
            days_to_rotten: null,
            add_time: '2018-09-04T06:24:59Z',
            update_time: null,
        },
    },
});

type PayloadBody = {
    current: PipedriveDealV2; // Ensure 'current' matches the v2 deal object
    previous: PipedriveDealV2; // Webhooks often include 'previous' state too
    event: string;
    // Other webhook payload fields
};