import { createAction, Property, ApFile, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpHeaders } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL, POLLING_INTERVAL_MS, LONG_MAX_POLLING_ATTEMPTS, pollTaskUntilComplete } from '../common';
import FormData from 'form-data';

export const separateAudio = createAction({
    auth: cambaiAuth,
    name: 'separate_audio',
    displayName: 'Separate Audio',
    description: 'Separate audio into foreground (vocals) and background (music/noise) tracks.',
    props: {
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
            auth: cambaiAuth,
            displayName: 'Media',
            required: true,
            refreshers: ['source_type'],
            props: async (context) => {
                const sourceType = (context['source_type'] as unknown as string);
                const fields: DynamicPropsValue = {};
                if (sourceType === 'file') {
                    fields['audio_file'] = Property.File({
                        displayName: 'Audio File',
                        description: 'The audio file to separate (e.g., MP3, WAV).',
                        required: true,
                    });
                } else if (sourceType === 'url') {
                    fields['media_url'] = Property.ShortText({
                        displayName: 'Media URL',
                        description: 'A public URL to the audio file to separate.',
                        required: true,
                    });
                }
                return fields;
            }
        }),
    },
    async run(context) {
        const { auth } = context;
        const { source_type, media } = context.propsValue;

        const formData = new FormData();

        if (source_type === 'url') {
            if (!media['media_url']) throw new Error("Media URL is required when source is 'File URL'.");
            formData.append('media_url', media['media_url'] as string);
        } else {
            if (!media['audio_file']) throw new Error("Audio File is required when source is 'Upload File'.");
            const fileData = media['audio_file'] as ApFile;
            formData.append('audio_file', fileData.data, fileData.filename);
        }

        const requestBody = formData.getBuffer();
        const headers: HttpHeaders = {
            'x-api-key': auth.secret_text,
            ...formData.getHeaders(),
        };

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/audio-separation`,
            headers,
            body: requestBody,
        });
        const taskId = initialResponse.body.task_id;

        const runId = await pollTaskUntilComplete(
            auth.secret_text,
            `${API_BASE_URL}/audio-separation/${taskId}`,
            LONG_MAX_POLLING_ATTEMPTS,
            POLLING_INTERVAL_MS,
        );

        const resultResponse = await httpClient.sendRequest<{
            foreground_audio_url: string;
            background_audio_url: string;
        }>({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/audio-separation-result/${runId}`,
            headers: { 'x-api-key': auth.secret_text },
        });

        return resultResponse.body;
    },
});
