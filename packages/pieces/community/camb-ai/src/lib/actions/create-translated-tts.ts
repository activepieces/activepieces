import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL, listSourceLanguagesDropdown, listTargetLanguagesDropdown, POLLING_INTERVAL_MS, MAX_POLLING_ATTEMPTS, pollTaskUntilComplete, listFoldersDropdown } from '../common';

export const createTranslatedTts = createAction({
    auth: cambaiAuth,
    name: 'create_translated_tts',
    displayName: 'Create Translated Text-to-Speech',
    description: 'Translate text and generate speech in the target language in one step.',
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text to translate and convert to speech.',
            required: true,
        }),
        source_language: listSourceLanguagesDropdown,
        target_language: listTargetLanguagesDropdown,
        voice_id: Property.Dropdown({
            auth: cambaiAuth,
            displayName: 'Voice',
            description: 'Select the voice to generate the speech (optional).',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                const response = await httpClient.sendRequest<{ id: number; voice_name: string }[]>({
                    method: HttpMethod.GET,
                    url: `${API_BASE_URL}/list-voices`,
                    headers: { 'x-api-key': auth.secret_text },
                });
                const voices = response.body ?? [];
                return {
                    disabled: false,
                    options: voices.map((voice) => ({
                        label: voice.voice_name,
                        value: voice.id,
                    })),
                };
            },
        }),
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'A memorable name for your project to help organize tasks in your Camb.ai workspace.',
            required: false,
        }),
        folder_id: listFoldersDropdown,
    },
    async run(context) {
        const { auth } = context;
        const { text, source_language, target_language, voice_id, project_name, folder_id } = context.propsValue;

        const payload: Record<string, unknown> = {
            text,
            source_language: Number(source_language),
            target_language: Number(target_language),
        };
        if (voice_id !== undefined && voice_id !== null) payload['voice_id'] = Number(voice_id);
        if (project_name) payload['project_name'] = project_name;
        if (folder_id) payload['folder_id'] = folder_id;

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/translated-tts`,
            headers: { 'x-api-key': auth.secret_text, 'Content-Type': 'application/json' },
            body: payload,
        });
        const taskId = initialResponse.body.task_id;

        const runId = await pollTaskUntilComplete(
            auth.secret_text,
            `${API_BASE_URL}/translated-tts/${taskId}`,
            MAX_POLLING_ATTEMPTS,
            POLLING_INTERVAL_MS,
        );

        const audioResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/tts-result/${runId}`,
            headers: { 'x-api-key': auth.secret_text },
            responseType: 'arraybuffer',
        });

        const fileName = `translated_speech_${runId}.wav`;
        const fileData = Buffer.from(audioResponse.body as ArrayBuffer);
        const fileUrl = await context.files.write({
            fileName,
            data: fileData,
        });

        return {
            message: 'Translated speech generated successfully.',
            audio_url: fileUrl,
            run_id: runId,
        };
    },
});
