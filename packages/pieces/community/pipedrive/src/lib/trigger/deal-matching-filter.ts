import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import { pipedriveApiCall, pipedrivePaginatedApiCall, pipedriveTransformCustomFields } from '../common';
import { GetField, PaginatedResponse } from '../common/types'; // Using PaginatedResponse for list types
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Deal in v2 (reused from previous updates)
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
}

// Update PaginatedResponse to use PipedriveDealV2
interface ListDealsResponseV2 extends PaginatedResponse<PipedriveDealV2> {}

export const dealMatchingFilterTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'deal-matching-filter',
    displayName: 'Deal Matching Filter',
    description: 'Triggers when a deal newly matches a Pipedrive filter for the first time (using Pipedrive API v2).', // Updated description
    type: TriggerStrategy.POLLING,
    props: {
        filterId: filterIdProp('deals', true),
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: false,
            defaultValue: 'all_not_deleted',
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Open',
                        value: 'open',
                    },
                    {
                        label: 'Won',
                        value: 'won',
                    },
                    {
                        label: 'Lost',
                        value: 'lost',
                    },
                    {
                        label: 'Deleted', // In v2, 'deleted' is a valid status for filtering
                        value: 'deleted',
                    },
                    {
                        label: 'All (Not Deleted)', // Clarified label
                        value: 'all_not_deleted',
                    },
                ],
            },
        }),
    },
    async onEnable(context) {
        const ids: number[] = [];

        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        // Assumes pipedrivePaginatedApiCall handles cursor-based pagination internally for v2
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals', // Updated to v2 endpoint
            query: {
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
                filter_id: context.propsValue.filterId,
                status: context.propsValue.status, // Status parameter is still valid
            },
        });

        if (!isNil(response)) {
            response.forEach((deal) => {
                ids.push(deal.id);
            });
        }

        await context.store.put('deals', JSON.stringify(ids));
    },
    async onDisable(context) {
        await context.store.delete('deals');
    },
    async test(context) {
        const deals = [];

        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        // Assumes pipedriveApiCall handles cursor-based pagination internally for v2 if needed,
        // otherwise, it might need to be adjusted to pass 'cursor' instead of 'limit' for full pagination.
        const response = await pipedriveApiCall<ListDealsResponseV2>({ // Using ListDealsResponseV2 for list type
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals', // Updated to v2 endpoint
            query: {
                limit: 10,
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
                filter_id: context.propsValue.filterId,
                status: context.propsValue.status,
            },
        });

        if (isNil(response.data)) {
            return [];
        }

        for (const deal of response.data) {
            deals.push(deal);
        }

        // IMPORTANT: Changed resourceUri for custom fields to /dealFields
        // Assumes pipedrivePaginatedApiCall handles cursor-based pagination internally for v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields', // Updated to v2 endpoint
        });

        const result = [];

        for (const deal of deals) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
            result.push(updatedDealProperties);
        }

        return result;
    },
    async run(context) {
        const existingIds = (await context.store.get<string>('deals')) ?? '[]';
        const parsedExistingIds = JSON.parse(existingIds) as number[];

        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        // Assumes pipedrivePaginatedApiCall handles cursor-based pagination internally for v2
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals', // Updated to v2 endpoint
            query: {
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
                filter_id: context.propsValue.filterId,
                status: context.propsValue.status,
            },
        });

        if (isNil(response) || response.length === 0) {
            return [];
        }

        // Filter valid deals
        const newDeals = response.filter((deal) => !parsedExistingIds.includes(deal.id));

        const newIds = newDeals.map((deal) => deal.id);

        if (newIds.length === 0) {
            return [];
        }

        // Store new IDs
        const updatedIds = Array.from(new Set([...newIds, ...parsedExistingIds])); // Use Set to avoid duplicates
        await context.store.put('deals', JSON.stringify(updatedIds));

        // IMPORTANT: Changed resourceUri for custom fields to /dealFields
        // Assumes pipedrivePaginatedApiCall handles cursor-based pagination internally for v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields', // Updated to v2 endpoint
        });

        const result = [];

        // Transform valid deal fields
        for (const deal of newDeals) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
            result.push(updatedDealProperties);
        }

        return result;
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
        is_deleted: false, // Added for v2, negation of old active
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