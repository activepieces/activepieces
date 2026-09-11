import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';
import { hkVoiceProps } from '../common/props';

export const createCallFlowAction = createAction({
    auth: hkVoiceAuth,
    name: 'create_call_flow',
    classification: 'WRITE',
    displayName: 'Create Call Flow',
    description: 'Creates a Voice call flow (scripts, prompt, qualification questions).',
    audience: 'both',
    aiMetadata: {
        description:
            'Creates a Heykoala Voice call flow with name, opening/closing scripts, and core prompt. Use to author telephony scripts from Zwigly. Retries create duplicates.',
        idempotent: false,
    },
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        prompt: Property.LongText({
            displayName: 'Prompt',
            description: 'Core instructions between greeting and closing.',
            required: false,
        }),
        opening_script: Property.LongText({
            displayName: 'Opening script',
            required: false,
        }),
        closing_script: Property.LongText({
            displayName: 'Closing script',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        is_active: Property.Checkbox({
            displayName: 'Active',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.POST,
            path: hkVoiceApi.paths.callFlows,
            body: {
                name: context.propsValue.name,
                prompt: context.propsValue.prompt,
                opening_script: context.propsValue.opening_script,
                closing_script: context.propsValue.closing_script,
                description: context.propsValue.description,
                is_active: context.propsValue.is_active ?? true,
            },
        });
        return hkVoiceApi.flattenBody(body);
    },
});

export const updateCallFlowAction = createAction({
    auth: hkVoiceAuth,
    name: 'update_call_flow',
    classification: 'WRITE',
    displayName: 'Update Call Flow',
    description: 'Updates an existing Voice call flow.',
    audience: 'both',
    aiMetadata: {
        description: 'Patches a Voice call flow name, scripts, or prompt.',
        idempotent: true,
    },
    props: {
        call_flow_id: hkVoiceProps.callFlowId,
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        prompt: Property.LongText({
            displayName: 'Prompt',
            required: false,
        }),
        opening_script: Property.LongText({
            displayName: 'Opening script',
            required: false,
        }),
        closing_script: Property.LongText({
            displayName: 'Closing script',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        is_active: Property.Checkbox({
            displayName: 'Active',
            required: false,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const patch: Record<string, string | boolean> = {};
        if (context.propsValue.name) {
            patch['name'] = context.propsValue.name;
        }
        if (context.propsValue.prompt) {
            patch['prompt'] = context.propsValue.prompt;
        }
        if (context.propsValue.opening_script) {
            patch['opening_script'] = context.propsValue.opening_script;
        }
        if (context.propsValue.closing_script) {
            patch['closing_script'] = context.propsValue.closing_script;
        }
        if (context.propsValue.description) {
            patch['description'] = context.propsValue.description;
        }
        if (context.propsValue.is_active !== undefined) {
            patch['is_active'] = context.propsValue.is_active;
        }
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.PATCH,
            path: hkVoiceApi.paths.callFlowById(context.propsValue.call_flow_id),
            body: patch,
        });
        return hkVoiceApi.flattenBody(body);
    },
});

export const listCallFlowsAction = createAction({
    auth: hkVoiceAuth,
    name: 'list_call_flows',
    classification: 'READ',
    displayName: 'List Call Flows',
    description: 'Lists Voice call flows for the organization.',
    audience: 'both',
    aiMetadata: {
        description: 'Lists Voice call flows available to the API key.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.callFlows,
            query: { limit: 200, offset: 0 },
        });
        return {
            call_flows: hkVoiceApi.extractList({
                body,
                collectionKeys: ['results', 'callflows'],
            }),
        };
    },
});
