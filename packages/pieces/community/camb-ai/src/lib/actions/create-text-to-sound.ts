import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL, MAX_POLLING_ATTEMPTS, POLLING_INTERVAL_MS, pollTaskUntilComplete, listFoldersDropdown } from '../common';

export const createTextToSound = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_sound',
    displayName: 'Create Text-to-Sound',
    description: 'Convert input text into “sound effects” using an AI model.',
    props: {
        prompt: Property.LongText({
            displayName: 'Prompt',
            description: 'A clear, descriptive explanation of the desired audio effect. Concise prompts yield more accurate results.',
            required: true,
        }),
        duration: Property.Number({
            displayName: 'Duration (seconds)',
            description: 'The desired length of the audio in seconds (max 10). Defaults to 8 if not set.',
            required: false,
        }),
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'A memorable name for your project to help organize tasks in your Camb.ai workspace.',
            required: false,
        }),
        project_description: Property.LongText({
            displayName: 'Project Description',
            description: 'Provide details about your project\'s goals and specifications for documentation purposes.',
            required: false,
        }),
        folder_id: listFoldersDropdown,
    },
    async run(context) {
        const { auth } = context;
        const { prompt, duration, project_name, project_description, folder_id } = context.propsValue;

        const payload: Record<string, unknown> = { prompt };
        if (duration) payload['duration'] = duration;
        if (project_name) payload['project_name'] = project_name;
        if (project_description) payload['project_description'] = project_description;
        if (folder_id) payload['folder_id'] = folder_id;

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/text-to-sound`,
            headers: {
                'x-api-key': auth.secret_text,
                'Content-Type': 'application/json'
            },
            body: payload,
        });
        const taskId = initialResponse.body.task_id;

        const runId = await pollTaskUntilComplete(
            auth.secret_text,
            `${API_BASE_URL}/text-to-sound/${taskId}`,
            MAX_POLLING_ATTEMPTS,
            POLLING_INTERVAL_MS,
        );

        const audioResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/text-to-sound-result/${runId}`,
            headers: { 'x-api-key': auth.secret_text },
            responseType: 'arraybuffer',
        });

        const fileName = `sound_${runId}.wav`;
        const fileData = Buffer.from(audioResponse.body as ArrayBuffer);
        const fileUrl = await context.files.write({
            fileName,
            data: fileData,
        });

        return {
            message: 'Sound generated successfully.',
            audio_url: fileUrl,
            run_id: runId,
        };
    },
});