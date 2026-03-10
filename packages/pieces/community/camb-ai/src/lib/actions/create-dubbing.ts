import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL, listSourceLanguagesDropdown, listTargetLanguagesMultiSelectDropdown, LONG_POLLING_INTERVAL_MS, LONG_MAX_POLLING_ATTEMPTS, pollTaskUntilComplete, listFoldersDropdown } from '../common';

export const createDubbing = createAction({
    auth: cambaiAuth,
    name: 'create_dubbing',
    displayName: 'Create Dubbing',
    description: 'Dub a video or audio from one language into one or more target languages.',
    props: {
        video_url: Property.ShortText({
            displayName: 'Video/Audio URL',
            description: 'A public URL to the video or audio file to dub.',
            required: true,
        }),
        source_language: listSourceLanguagesDropdown,
        target_languages: listTargetLanguagesMultiSelectDropdown,
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'A memorable name for your project to help organize tasks in your Camb.ai workspace.',
            required: false,
        }),
        folder_id: listFoldersDropdown,
    },
    async run(context) {
        const { auth } = context;
        const { video_url, source_language, target_languages, project_name, folder_id } = context.propsValue;

        const payload: Record<string, unknown> = {
            video_url,
            source_language: Number(source_language),
            target_languages: (target_languages as number[]).map(Number),
        };
        if (project_name) payload['project_name'] = project_name;
        if (folder_id) payload['folder_id'] = folder_id;

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/dub`,
            headers: { 'x-api-key': auth.secret_text, 'Content-Type': 'application/json' },
            body: payload,
        });
        const taskId = initialResponse.body.task_id;

        const runId = await pollTaskUntilComplete(
            auth.secret_text,
            `${API_BASE_URL}/dub/${taskId}`,
            LONG_MAX_POLLING_ATTEMPTS,
            LONG_POLLING_INTERVAL_MS,
        );

        const resultResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/dub-result/${runId}`,
            headers: { 'x-api-key': auth.secret_text },
        });

        return resultResponse.body;
    },
});
