import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    pipedriveApiCall,
    pipedriveCommon, // Assuming this is updated to handle v2 webhooks
    pipedrivePaginatedApiCall, // Assuming this is updated to handle v2 cursor-based pagination
    // pipedriveTransformCustomFields, // Removed as notes do not have custom fields directly in v2
} from '../common';
import { isNil } from '@activepieces/shared';

// Define the structure for a Pipedrive Note in v2
interface PipedriveNoteV2 {
    id: number;
    user_id: number; // The user who owns the note (owner_id in other contexts)
    deal_id: number | null;
    person_id: number | null;
    org_id: number | null;
    lead_id: string | null; // Lead IDs are UUIDs
    content: string;
    add_time: string; // RFC 3339 format
    update_time: string; // RFC 3339 format
    is_deleted: boolean; // Replaces active_flag, is negation of old value
    // Pinned flags are removed from the main object in v2
    last_update_user_id: number | null; // This field is removed in v2, but kept for sample consistency if needed elsewhere
    // Related objects are no longer nested, just their IDs are present
}

// Update LeadListResponse (or create a specific NoteListResponseV2)
interface NoteListResponseV2 {
    data: PipedriveNoteV2[];
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

interface GetNoteResponseV2 {
    data: PipedriveNoteV2;
}

export const newNoteTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'new-note',
    displayName: 'New Note',
    description: 'Triggers when a new note is created.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        // IMPORTANT: Changed API version from v1 to v2 for webhooks
        const webhook = await pipedriveCommon.subscribeWebhook(
            'note',
            'added',
            context.webhookUrl!,
            context.auth.data['api_domain'],
            context.auth.access_token,
        );
        await context.store?.put<{
            webhookId: string;
        }>('_new_note_trigger', {
            webhookId: webhook.data.id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<{
            webhookId: string;
        }>('_new_note_trigger');
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
        const response = await pipedriveApiCall<NoteListResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/notes', // Updated to v2 endpoint
            query: {
                limit: 10,
                sort_by: 'update_time', // Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // Added 'sort_direction'
            },
        });

        if (isNil(response.data)) {
            return [];
        }

        // Notes in v2 do not have custom fields directly on the note object itself.
        // So, pipedriveTransformCustomFields is not applicable here.
        return response.data;
    },
    async run(context) {
        const payloadBody = context.payload.body as {
            current: PipedriveNoteV2; // Ensure 'current' matches the v2 note object
            previous: PipedriveNoteV2; // Webhooks often include 'previous' state too
            event: string;
            // Other webhook payload fields
        };

        // IMPORTANT: Changed API version from v1 to v2
        const noteResponse = await pipedriveApiCall<GetNoteResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/notes/${payloadBody.current.id}`, // Updated to v2 endpoint
        });

        // Notes in v2 do not have custom fields directly on the note object itself.
        // So, pipedriveTransformCustomFields is not applicable here.
        return [noteResponse.data];
    },
    sampleData: {
        id: 1,
        user_id: 22701301, // Renamed from owner_id in some contexts, but 'user_id' is used for notes
        deal_id: null,
        person_id: 1,
        org_id: 1,
        lead_id: null,
        content: 'Note content for v2 API.',
        add_time: '2024-12-04T06:48:26Z', // RFC 3339 format
        update_time: '2024-12-04T06:48:26Z', // RFC 3339 format
        is_deleted: false, // Replaces active_flag, negated boolean
        // Removed pinned_to_deal_flag, pinned_to_person_flag, pinned_to_organization_flag, pinned_to_lead_flag
        // Removed last_update_user_id (as it's for internal use or removed)
        // Removed nested organization, person, deal, lead, user objects
    },
});