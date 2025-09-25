import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../../index';
import { API_BASE_URL, MAX_POLLING_ATTEMPTS, POLLING_INTERVAL_MS } from '../common';
import { listFoldersDropdown } from '../common';

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
                'x-api-key': auth,
                'Content-Type': 'application/json'
            },
            body: payload,
        });

        const taskId = initialResponse.body.task_id;
        let attempts = 0;
        let run_id: string | null = null;
        while (attempts < MAX_POLLING_ATTEMPTS) {
            const statusResponse = await httpClient.sendRequest<{
                status: string, run_id?: string
            }>({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/text-to-sound/${taskId}`,
                headers: {
                    'x-api-key': auth,
                },
            });

            const status = statusResponse.body.status;

            if (status === 'SUCCESS') {

                run_id = statusResponse.body.run_id ?? null;
                break;
            }

            if (status === 'FAILED') {

                throw new Error(`Sound generation task failed: ${JSON.stringify(statusResponse.body)}`);
            }


            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            attempts++;
        }


        if (!run_id) {
            throw new Error("Sound generation task timed out or failed to return a run_id.");
        }
        const audioResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/text-to-sound-result/${run_id}`,
            headers: { 'x-api-key': auth },
            responseType: 'arraybuffer',
        });

        return { audio: audioResponse.body };

    },
});