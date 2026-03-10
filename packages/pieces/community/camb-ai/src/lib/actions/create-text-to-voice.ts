import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL, POLLING_INTERVAL_MS, MAX_POLLING_ATTEMPTS, pollTaskUntilComplete } from '../common';

export const createTextToVoice = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_voice',
    displayName: 'Create Voice from Description',
    description: 'Generate a new voice based on a text description of the desired voice characteristics.',
    props: {
        text: Property.LongText({
            displayName: 'Sample Text',
            description: 'A sample text that will be spoken using the generated voice.',
            required: true,
        }),
        voice_description: Property.LongText({
            displayName: 'Voice Description',
            description: 'A detailed description of the desired voice characteristics (at least 18 words recommended).',
            required: true,
        }),
    },
    async run(context) {
        const { auth } = context;
        const { text, voice_description } = context.propsValue;

        const payload = {
            text,
            voice_description,
        };

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/text-to-voice`,
            headers: { 'x-api-key': auth.secret_text, 'Content-Type': 'application/json' },
            body: payload,
        });
        const taskId = initialResponse.body.task_id;

        const runId = await pollTaskUntilComplete(
            auth.secret_text,
            `${API_BASE_URL}/text-to-voice/${taskId}`,
            MAX_POLLING_ATTEMPTS,
            POLLING_INTERVAL_MS,
        );

        const resultResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/text-to-voice-result/${runId}`,
            headers: { 'x-api-key': auth.secret_text },
        });

        return resultResponse.body;
    },
});
