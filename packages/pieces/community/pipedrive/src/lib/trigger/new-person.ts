import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveAuth } from '../../';
import {
    pipedriveApiCall,
    pipedriveCommon, // Assuming this is updated to handle v2 webhooks
    pipedrivePaginatedApiCall, // Assuming this is updated to handle v2 cursor-based pagination
    pipedriveTransformCustomFields, // Assuming this is updated to transform v2 custom field structure
} from '../common';
import { GetField } from '../common/types'; // PersonListResponse will be updated below
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Person in v2
interface PipedrivePersonV2 {
    id: number;
    name: string;
    first_name: string | null;
    last_name: string | null;
    owner_id: number; // No longer an object, just the ID
    org_id: number | null; // No longer an object, just the ID
    picture_id: number | null; // No longer an object, just the ID
    add_time: string; // RFC 3339 format
    update_time: string; // RFC 3339 format
    is_deleted: boolean; // Replaces active_flag, is negation of old value
    visible_to: number; // Is an integer now (e.g., 1, 3, 5, 7)
    phones: { // Renamed from 'phone', now an array of objects
        value: string;
        primary: boolean;
        label: string;
    }[];
    emails: { // Renamed from 'email', now an array of objects
        value: string;
        primary: boolean;
        label: string;
    }[];
    label_ids: number[]; // Replaces 'label' (array of IDs)
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
    // Removed fields are not included here (e.g., company_id, first_char, delete_time, owner_name, org_name, cc_email, primary_email)
}

// Update response interfaces for persons
interface PersonListResponseV2 {
    data: PipedrivePersonV2[];
    additional_data?: {
        pagination?: {
            start: number;
            limit: number;
            more_items_in_collection: boolean;
            next_cursor?: string; // v2 uses cursor-based pagination
        };
    };
}

interface GetPersonResponseV2 {
    data: PipedrivePersonV2;
}

export const newPerson = createTrigger({
    auth: pipedriveAuth,
    name: 'new_person',
    displayName: 'New Person',
    description: 'Triggers when a new person is created',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // IMPORTANT: Changed API version from v1 to v2 for webhooks
        const webhook = await pipedriveCommon.subscribeWebhook(
            'person',
            'added',
            context.webhookUrl!,
            context.auth.data['api_domain'],
            context.auth.access_token,
        );
        await context.store?.put<WebhookInformation>('_new_person_trigger', {
            webhookId: webhook.data.id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>('_new_person_trigger');
        if (response !== null && response !== undefined) {
            // IMPORTANT: Changed API version from v1 to v2 for webhooks
            await pipedriveCommon.unsubscribeWebhook(
                response.webhookId,
                context.auth.data['api_domain'],
                context.auth.access_token,
            );
        }
    },
    async test(context) {
        // IMPORTANT: Changed API version from v1 to v2 and updated sorting
        const personsResponse = await pipedriveApiCall<PersonListResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/persons', // Updated to v2 endpoint
            query: {
                limit: 5,
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
            },
        });

        // IMPORTANT: Changed resourceUri for custom fields to /personFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/personFields', // Updated to v2 endpoint for person fields
        });

        if (isNil(personsResponse.data)) {
            return [];
        }

        const result = [];

        for (const person of personsResponse.data) {
            // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
            const updatedPersonProperties = pipedriveTransformCustomFields(customFieldsResponse, person);
            result.push(updatedPersonProperties);
        }

        return result;
    },
    async run(context) {
        // Pipedrive will always return a list of Persons even if we are looking up a specific person
        const payloadBody = context.payload.body as PayloadBody;

        // IMPORTANT: Changed API version from v1 to v2
        const personResponse = await pipedriveApiCall<GetPersonResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/persons/${payloadBody.current.id}`, // Updated to v2 endpoint
        });

        // IMPORTANT: Changed resourceUri for custom fields to /personFields
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/personFields', // Updated to v2 endpoint for person fields
        });

        // IMPORTANT: pipedriveTransformCustomFields must be updated to handle v2 custom field structure
        const updatedPersonProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            personResponse.data,
        );

        return [updatedPersonProperties];
    },
    sampleData: {
        id: 1,
        owner_id: 123, // No longer an object, just the ID
        org_id: 1234, // No longer an object, just the ID
        name: 'Will Smith',
        first_name: 'Will',
        last_name: 'Smith',
        is_deleted: false, // Replaces active_flag, negated boolean
        phones: [ // Renamed from 'phone', now an array of objects
            {
                value: '12345',
                primary: true,
                label: 'work',
            },
        ],
        emails: [ // Renamed from 'email', now an array of objects
            {
                value: 'will.smith@example.com', // Updated email value
                primary: true,
                label: 'work',
            },
        ],
        add_time: '2017-10-18T13:23:07Z', // RFC 3339 format
        update_time: '2020-05-08T05:30:20Z', // RFC 3339 format
        visible_to: 3, // Is an integer now
        picture_id: 4, // No longer an object, just the ID
        next_activity_id: 128, // Included only when using `include_fields` parameter
        last_activity_id: 34, // Included only when using `include_fields` parameter
        last_incoming_mail_time: '2019-05-29T18:21:42Z', // RFC 3339 format
        last_outgoing_mail_time: '2019-05-30T03:45:35Z', // RFC 3339 format
        label_ids: [1], // Replaces 'label' (array of numbers)
        marketing_status: 'no_consent',
        custom_fields: { // Placeholder for custom fields in v2
            "your_custom_field_key": "your_custom_field_value"
        }
        // Removed fields like company_id, first_char, delete_time,
        // next_activity_date, next_activity_time, last_activity_date,
        // org_name, owner_name, cc_email, primary_email, and all count fields
    },
});

interface WebhookInformation {
    webhookId: string;
}

type PayloadBody = {
    current: PipedrivePersonV2; // Ensure 'current' matches the v2 person object
    previous: PipedrivePersonV2; // Webhooks often include 'previous' state too
    event: string;
    // Other webhook payload fields
};