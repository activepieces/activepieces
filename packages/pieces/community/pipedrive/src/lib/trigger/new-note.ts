import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    pipedriveApiCall,
    pipedriveCommon,
} from '../common';
import { isNil } from '@activepieces/shared';

interface PipedriveNoteV2 {
    id: number;
    user_id: number;
    deal_id: number | null;
    person_id: number | null;
    org_id: number | null;
    lead_id: string | null;
    content: string;
    add_time: string;
    update_time: string;
    is_deleted: boolean;
    last_update_user_id: number | null;
}

interface NoteListResponseV2 {
    data: PipedriveNoteV2[];
    additional_data?: {
        pagination?: {
            start: number;
            limit: number;
            more_items_in_collection: boolean;
            next_cursor?: string;
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
        const webhook = await pipedriveCommon.subscribeWebhook(
            'note',
            'create',
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
            await pipedriveCommon.unsubscribeWebhook(
                response.webhookId,
                context.auth.data['api_domain'],
                context.auth.access_token,
            );
        }
    },
    async test(context) {
        const response = await pipedriveApiCall<NoteListResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/notes',
            query: {
                limit: 10,
                sort: 'update_time DESC',
            },
        });

        if (isNil(response.data)) {
            return [];
        }
        return response.data;
    },
    async run(context) {
        const payloadBody = context.payload.body as {
            data: PipedriveNoteV2;
            previous: PipedriveNoteV2;
            meta: {
				action: string;
				entity: string;
			};
        };

        const noteResponse = await pipedriveApiCall<GetNoteResponseV2>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v1/notes/${payloadBody.data.id}`,
        });

        return [noteResponse.data];
    },
    sampleData: {
        id: 1,
        user_id: 22701301,
        deal_id: null,
        person_id: 1,
        org_id: 1,
        lead_id: null,
        content: 'Note content for v2 API.',
        add_time: '2024-12-04T06:48:26Z',
        update_time: '2024-12-04T06:48:26Z',
        is_deleted: false,
    },
});
