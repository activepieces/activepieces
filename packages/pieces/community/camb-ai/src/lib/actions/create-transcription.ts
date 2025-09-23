import { createAction, Property, ApFile, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpMessageBody } from '@activepieces/pieces-common';
import { cambaiAuth } from '../../index';
import { API_BASE_URL, listSourceLanguagesDropdown ,POLLING_INTERVAL_MS,MAX_POLLING_ATTEMPTS} from '../common';

// Define polling constants
 // 10 minutes timeout for potentially long media files

export const createTranscription = createAction({
    auth: cambaiAuth,
    name: 'create_transcription',
    displayName: 'Create Transcription',
    description: 'Creates a task to process speech into readable text.',
    props: {
        language: listSourceLanguagesDropdown,
        source_type: Property.StaticDropdown({
            displayName: 'Media Source',
            description: 'Choose whether to upload a file or provide a URL.',
            required: true,
            defaultValue: 'file',
            options: {
                options: [
                    { label: 'Upload File', value: 'file' },
                    { label: 'File URL', value: 'url' },
                ]
            },
        }),
        media: Property.DynamicProperties({
            displayName: 'Media',
            required: true,
            refreshers: ['source_type'],
            props: async (context) => {
                // FIX: Use a two-step cast (as unknown as string) to resolve the type error.
                const sourceType = (context['source_type'] as unknown as string);
                const fields: DynamicPropsValue = {};

                if (sourceType === 'file') {
                    fields['media_file'] = Property.File({
                        displayName: 'Media File',
                        description: 'The media file (e.g., MP3, WAV, MP4) to transcribe. Max size: 20MB.',
                        required: true,
                    });
                } else if (sourceType === 'url') {
                    fields['media_url'] = Property.ShortText({
                        displayName: 'Media URL',
                        description: 'A public URL to the media file to transcribe.',
                        required: true,
                    });
                }
                return fields;
            }
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
        folder_id: Property.Number({
            displayName: 'Folder ID',
            description: 'The ID of an existing folder in your workspace to store this task.',
            required: false,
        }),
    },
    async run(context) {
        const { auth } = context;
        const { language, source_type, media, project_name, project_description, folder_id } = context.propsValue;

        const formData: Record<string, unknown> = {
            language: Number(language),
        };
        if (project_name) formData['project_name'] = project_name;
        if (project_description) formData['project_description'] = project_description;
        if (folder_id) formData['folder_id'] = folder_id;

        let requestBody: HttpMessageBody;

        if (source_type === 'url') {
            if (!media['media_url']) throw new Error("Media URL is required when source is 'File URL'.");
            formData['media_url'] = media['media_url'];
            requestBody = formData;
        } else {
            if (!media['media_file']) throw new Error("Media File is required when source is 'Upload File'.");
            const fileData = media['media_file'] as ApFile;
            formData['media_file'] = {
                filename: fileData.filename,
                data: fileData.data,
            };
            requestBody = formData;
        }

        // Step 1: Submit the initial request to create the task
        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/transcribe`,
            headers: { 'x-api-key': auth },
            body: requestBody,
        });
        const taskId = initialResponse.body.task_id;

        // Step 2: Poll the status endpoint until the task is complete
        let attempts = 0;
        while (attempts < MAX_POLLING_ATTEMPTS) {
            const statusResponse = await httpClient.sendRequest<{ status: string, [key: string]: unknown }>({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/transcribe/${taskId}`,
                headers: { 'x-api-key': auth },
            });

            if (statusResponse.body.status === 'SUCCESS') {
                return statusResponse.body;
            }
            if (statusResponse.body.status === 'FAILED') {
                throw new Error(`Transcription task failed: ${JSON.stringify(statusResponse.body)}`);
            }
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            attempts++;
        }

        throw new Error("Transcription task timed out after 10 minutes.");
    },
});