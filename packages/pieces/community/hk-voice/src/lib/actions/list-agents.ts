import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';

export const listAgentsAction = createAction({
    auth: hkVoiceAuth,
    name: 'list_agents',
    classification: 'READ',
    displayName: 'List Agents',
    description: 'Lists organization Voice agents.',
    audience: 'both',
    aiMetadata: {
        description: 'Lists Voice organization agents available to the API key.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.agents,
            query: { limit: 200, offset: 0 },
        });
        return {
            agents: hkVoiceApi.extractList({
                body,
                collectionKeys: ['results', 'agents'],
            }),
        };
    },
});
