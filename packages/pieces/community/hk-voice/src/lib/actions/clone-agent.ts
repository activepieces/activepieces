import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';
import { hkVoiceProps } from '../common/props';

export const cloneAgentAction = createAction({
    auth: hkVoiceAuth,
    name: 'clone_agent',
    classification: 'WRITE',
    displayName: 'Clone Marketplace Agent',
    description:
        'Clones a marketplace agent into the Voice organization. Ext API has no create-from-scratch — clone then update.',
    audience: 'both',
    aiMetadata: {
        description:
            'Clones a Heykoala Voice marketplace agent into the connected organization. Use before dispatching calls. Each call creates another clone, so retries duplicate.',
        idempotent: false,
    },
    props: {
        agent_id: hkVoiceProps.marketplaceAgentId,
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.POST,
            path: hkVoiceApi.paths.agentClone,
            body: {
                agent_id: context.propsValue.agent_id,
            },
        });
        return hkVoiceApi.flattenBody(body);
    },
});

export const updateAgentAction = createAction({
    auth: hkVoiceAuth,
    name: 'update_agent',
    classification: 'WRITE',
    displayName: 'Update Agent',
    description: 'Updates an organization Voice agent (name, description, base prompt).',
    audience: 'both',
    aiMetadata: {
        description:
            'Patches a Voice organization agent fields such as name, description, and base_prompt. Use after cloning from the marketplace.',
        idempotent: true,
    },
    props: {
        agent_id: hkVoiceProps.agentId,
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        base_prompt: Property.LongText({
            displayName: 'Base prompt',
            description: 'Personality / standing instructions for the agent.',
            required: false,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const patch: Record<string, string> = {};
        if (context.propsValue.name) {
            patch['name'] = context.propsValue.name;
        }
        if (context.propsValue.description) {
            patch['description'] = context.propsValue.description;
        }
        if (context.propsValue.base_prompt) {
            patch['base_prompt'] = context.propsValue.base_prompt;
        }
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.PATCH,
            path: hkVoiceApi.paths.agentById(context.propsValue.agent_id),
            body: patch,
        });
        return hkVoiceApi.flattenBody(body);
    },
});
