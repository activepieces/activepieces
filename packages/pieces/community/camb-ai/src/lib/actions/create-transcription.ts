import { createAction, Property, ApFile, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpMessageBody, HttpHeaders } from '@activepieces/pieces-common';
import { cambaiAuth } from '../../index';
import { API_BASE_URL, listSourceLanguagesDropdown, POLLING_INTERVAL_MS, LONG_MAX_POLLING_ATTEMPTS } from '../common';
import FormData from 'form-data';
import { listFoldersDropdown } from '../common';

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
        folder_id: listFoldersDropdown,
    },
    async run(context) {
        const { auth } = context;
        const { language, source_type, media, project_name, project_description, folder_id } = context.propsValue;

        const formData = new FormData();
        
        formData.append('language', Number(language).toString());
        if (project_name) formData.append('project_name', project_name);
        if (project_description) formData.append('project_description', project_description);
        if (folder_id) formData.append('folder_id', folder_id.toString());

        if (source_type === 'url') {
            if (!media['media_url']) throw new Error("Media URL is required when source is 'File URL'.");
            formData.append('media_url', media['media_url'] as string);
        } else {
            if (!media['media_file']) throw new Error("Media File is required when source is 'Upload File'.");
            const fileData = media['media_file'] as ApFile;
            formData.append('media_file', fileData.data, fileData.filename);
        }
        

        const requestBody = await formData.getBuffer();
        const headers: HttpHeaders = {
            'x-api-key': auth,
            ...formData.getHeaders(),
        };

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/transcribe`,
            headers: headers,
            body: requestBody, 
        });
        const taskId = initialResponse.body.task_id;
        let run_id: string | null = null;

        let attempts = 0;
        while (attempts < LONG_MAX_POLLING_ATTEMPTS) {
            const statusResponse = await httpClient.sendRequest<{ status: string; run_id?: string }>({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/transcribe/${taskId}`,
                headers: { 'x-api-key': auth },
            });

            if (statusResponse.body.status === 'SUCCESS') {
                run_id = statusResponse.body.run_id ?? null;
                break;
            }
            if (statusResponse.body.status === 'FAILED') {
                throw new Error(`Transcription task failed: ${JSON.stringify(statusResponse.body)}`);
            }
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            attempts++;
        }

        if (!run_id) {
            throw new Error("Transcription task timed out or failed to return a task_id.");
        }
        const resultResponse = await httpClient.sendRequest<{ transcriptions: string[] }>({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/transcription-result/${run_id}`,
            headers: { 'x-api-key': auth },
        });

        return resultResponse.body;
       
    },
});