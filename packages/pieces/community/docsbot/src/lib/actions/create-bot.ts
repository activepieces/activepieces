import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    httpClient,
} from '@activepieces/pieces-common';
import { docsbotAuth } from '../../index';
import { docsbotCommon } from '../common';

export const createBot = createAction({
    auth: docsbotAuth,
    name: 'create_bot',
    description: 'Creates a new bot.',
    displayName: 'Create Bot',
    props: {
        teamId: docsbotCommon.teamId,
        name: Property.ShortText({
            displayName: 'Bot Name',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        privacy: Property.StaticDropdown({
            displayName: 'Privacy',
            required: true,
            options: {
                options: [
                    { label: 'Public', value: 'public' },
                    { label: 'Private', value: 'private' },
                ]
            }
        }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'e.g., en, es, jp',
            required: false,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            required: true,
            options: {
                options: [
                    { label: 'GPT-4o', value: 'gpt-4o' },
                    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                    { label: 'GPT-4.1', value: 'gpt-4.1' },
                    { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
                ]
            }
        }),
        embeddingModel: Property.StaticDropdown({
            displayName: 'Embedding Model',
            description: 'Defaults will be used if not specified.',
            required: false,
            options: {
                options: [
                    { label: 'Text Embedding 3 Large', value: 'text-embedding-3-large' },
                    { label: 'Text Embedding 3 Small', value: 'text-embedding-3-small' },
                    { label: 'Embed Multilingual v3.0 (Cohere)', value: 'embed-multilingual-v3.0' },
                    { label: 'Embed v4.0 (Cohere)', value: 'embed-v4.0' },
                    { label: 'Text Embedding Ada 002', value: 'text-embedding-ada-002' },
                ]
            }
        }),
        copyFrom: Property.ShortText({
            displayName: 'Copy From Bot ID',
            description: 'The ID of an existing bot in your team to copy from.',
            required: false,
        }),
    },

    async run(context) {
        const { teamId, ...botData } = context.propsValue;

        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url: `https://docsbot.ai/api/teams/${teamId}/bots`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json',
            },
            body: botData,
        };

        const res = await httpClient.sendRequest(request);
        return res.body;
    },
});
