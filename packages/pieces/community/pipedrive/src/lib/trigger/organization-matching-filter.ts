import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField } from '../common/types'; // LeadListResponse will be replaced
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Organization in v2
interface PipedriveOrganizationV2 {
    id: number;
    name: string;
    owner_id: number; // No longer an object, just the ID
    add_time: string; // RFC 3339 format
    update_time: string; // RFC 3339 format
    is_deleted: boolean; // Replaces active_flag, is negation of old value
    visible_to: number; // Is an integer now (e.g., 1, 3, 5, 7)
    picture_id: number | null;
    label_ids: number[]; // Replaces 'label' (array of IDs)
    address: { // Is a nested object now
        value: string | null;
        street_number: string | null;
        route: string | null;
        sublocality: string | null;
        locality: string | null;
        admin_area_level_1: string | null;
        admin_area_level_2: string | null;
        country: string | null;
        postal_code: string | null;
        formatted_address: string | null;
    } | null;
    custom_fields: Record<string, unknown>; // Custom fields are now nested here
    // Fields that are only included with `include_fields` are marked as optional
    next_activity_id?: number | null;
    last_activity_id?: number | null;
    open_deals_count?: number;
    related_open_deals_count?: number;
    closed_deals_count?: number;
    related_closed_deals_count?: number;
    participant_open_deals_count?: number;
    participant_closed_deals_count?: number;
    email_messages_count?: number;
    activities_count?: number;
    done_activities_count?: number;
    undone_activities_count?: number;
    files_count?: number;
    notes_count?: number;
    followers_count?: number;
    won_deals_count?: number;
    related_won_deals_count?: number;
    lost_deals_count?: number;
    related_lost_deals_count?: number;
    last_incoming_mail_time?: string | null; // RFC 3339 format
    last_outgoing_mail_time?: string | null; // RFC 3339 format
    marketing_status?: string;
    doi_status?: string;
    // Removed fields are not included here (e.g., company_id, first_char, delete_time, owner_name, cc_email, etc.)
}

// Update response interfaces for organizations
interface OrganizationListResponseV2 {
    data: PipedriveOrganizationV2[];
    additional_data?: {
        pagination?: {
            start: number;
            limit: number;
            more_items_in_collection: boolean;
            next_cursor?: string; // v2 uses cursor-based pagination
        };
    };
}

export const organizationMatchingFilterTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'organization-matching-filter',
    displayName: 'Organization Matching Filter',
    description: 'Triggers when an organization newly matches a Pipedrive filter for the first time (using Pipedrive API v2).', // Updated description
    type: TriggerStrategy.POLLING,
    props: {
        filterId: filterIdProp('org', true),
    },
    async onEnable(context) {
        const ids: number[] = [];
        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        // Assumes pipedrivePaginatedApiCall handles cursor-based pagination internally for v2
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizations', // Updated to v2 endpoint. Field selectors like :(id) are removed in v2.
            query: {
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
                filter_id: context.propsValue.filterId,
            },
        });
        if (!isNil(response)) {
            response.forEach((organization) => {
                ids.push(organization.id);
            });
        }
        await context.store.put('organizations', JSON.stringify(ids));
    },
    async onDisable(context) {
        await context.store.delete('organizations');
    },
    async test(context) {
        const organizations = [];

        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        const response = await pipedriveApiCall<OrganizationListResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizations', // Updated to v2 endpoint
            query: {
                limit: 10,
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
                filter_id: context.propsValue.filterId,
            },
        });

        if (isNil(response.data)) {
            return [];
        }

        for (const org of response.data) {
            organizations.push(org);
        }

        // IMPORTANT: Changed resourceUri for custom fields to /organizationFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizationFields', // Updated to v2 endpoint for organization fields
        });

        const result = [];

        for (const org of organizations) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
            result.push(updatedOrgProperties);
        }

        return result;
    },
    async run(context) {
        const existingIds = (await context.store.get<string>('organizations')) ?? '[]';
        const parsedExistingIds = JSON.parse(existingIds) as number[];

        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        // Assumes pipedrivePaginatedApiCall handles cursor-based pagination internally for v2
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizations', // Updated to v2 endpoint
            query: {
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
                filter_id: context.propsValue.filterId,
            },
        });

        if (isNil(response) || response.length === 0) {
            return [];
        }

        // Filter valid organizations
        const newOrganizations = response.filter(
            (organization) => !parsedExistingIds.includes(organization.id),
        );

        const newIds = newOrganizations.map((organization) => organization.id);

        if (newIds.length === 0) {
            return [];
        }

        // Store new IDs
        await context.store.put('organizations', JSON.stringify([...newIds, ...parsedExistingIds]));

        // IMPORTANT: Changed resourceUri for custom fields to /organizationFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizationFields', // Updated to v2 endpoint for organization fields
        });

        const result = [];

        // Transform valid organizations fields
        for (const org of newOrganizations) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
            result.push(updatedOrgProperties);
        }

        return result;
    },
    sampleData: {
        id: 1,
        owner_id: 22701301, // No longer an object, just the ID
        name: 'Pipedrive Sample Org',
        add_time: '2024-12-04T03:49:06Z', // RFC 3339 format
        update_time: '2024-12-14T11:03:19Z', // RFC 3339 format
        is_deleted: false, // Replaces active_flag, negated boolean
        visible_to: 3, // Is an integer now
        picture_id: null,
        label_ids: [], // Replaces 'label' (array of numbers)
        address: { // Nested object now
            value: 'Mustamäe tee 3, Tallinn, Estonia', // Example address
            street_number: '3',
            route: 'Mustamäe tee',
            sublocality: 'Kristiine',
            locality: 'Tallinn',
            admin_area_level_1: 'Harju maakond',
            admin_area_level_2: null,
            country: 'Estonia',
            postal_code: '10616',
            formatted_address: 'Mustamäe tee 3, 10616 Tallinn, Estonia',
        },
        custom_fields: { // Placeholder for custom fields in v2
            "your_custom_field_key": "your_custom_field_value"
        }
        // Removed fields like company_id, country_code, first_char, delete_time,
        // next_activity_date, next_activity_time, last_activity_id, last_activity_date,
        // owner_name, cc_email, and all count fields (unless explicitly included via `include_fields`)
    },
});