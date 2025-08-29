import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

const pollingStoreKey = 'toggl_new_tag_trigger';

type Tag = {
    id: number;
    [key: string]: unknown;
}

export const newTag = createTrigger({
    auth: togglTrackAuth,
    name: 'new_tag',
    displayName: 'New Tag',
    description: 'Triggers when a new tag is created in a workspace.',
    props: {
        workspace_id: togglCommon.workspace_id,
    },
    sampleData: {
        "id": 987654321,
        "workspace_id": 987654,
        "name": "high-priority",
        "at": "2025-08-29T11:20:00+00:00",
        "creator_id": 555555
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const tags = await getTags(context.auth, context.propsValue.workspace_id as number);
        const tagIds = tags.map(tag => tag.id);
        
        await context.store.put(pollingStoreKey, tagIds);
    },

    async onDisable(context) {
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const storedTagIds = await context.store.get<number[]>(pollingStoreKey) ?? [];
        const currentTags = await getTags(context.auth, context.propsValue.workspace_id as number);
        
        const oldTagIdsSet = new Set(storedTagIds);
        const newTags = currentTags.filter(tag => !oldTagIdsSet.has(tag.id));

        if (newTags.length > 0) {
            const allCurrentIds = currentTags.map(tag => tag.id);
            await context.store.put(pollingStoreKey, allCurrentIds);
        }
        
        return newTags;
    },
});

async function getTags(apiToken: string, workspaceId: number): Promise<Tag[]> {
    const response = await httpClient.sendRequest<Tag[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/tags`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`,
        },
    });
    return response.body || [];
}