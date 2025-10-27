import { uscreenAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { uscreenCommon } from '../common/client';

export const beganToPlayVideo = createTrigger({
    name: 'began_to_play_video',
    displayName: 'Began to Play Video',
    description: 'Triggers when a user plays a video for the first time',
    auth: uscreenAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        id: 'play_123456',
        event_type: 'video.play_started',
        data: {
            user_id: 'user_123456',
            video_id: 'video_789',
            video_title: 'Introduction to Uscreen',
            play_time: 0,
            duration: 300,
            created_at: '2024-01-15T10:30:00Z',
            is_first_play: true
        }
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await uscreenCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                name: 'Activepieces - Began to Play Video',
                events: ['video.play_started'],
                url: webhookUrl,
                active: true
            },
        });

        await context.store.put('webhook_id', response.body.id);
        return response.body;
    },
    onDisable: async (context) => {
        const { auth } = context;
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await uscreenCommon.apiCall({
                auth,
                method: HttpMethod.DELETE,
                resourceUri: `/webhooks/${webhookId}`,
            });
        }
    },
    run: async (context) => {
        return [context.payload.body];
    },
});
