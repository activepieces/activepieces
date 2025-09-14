import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { vlmRunAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const analyzeAudioAction = createAction({
    auth: vlmRunAuth,
    name: 'analyze_audio',
    displayName: 'Analyze Audio',
    description: 'Process an audio file, extracting features or transcription.',
    props: {
        domain: Property.StaticDropdown({
            displayName: 'Domain',
            description: 'The analysis to perform on the audio.',
            required: true,
            options: {
                options: [
                    { label: 'Transcription', value: 'audio.transcription' },
                    { label: 'Transcription with Summary', value: 'audio.transcription-summary' },
                ],
            },
        }),
        url: Property.ShortText({
            displayName: 'Audio URL',
            description: 'The public URL of the audio file to process. **Provide either a URL or a File ID.**',
            required: false,
        }),
        file_id: Property.ShortText({
            displayName: 'File ID',
            description: 'The ID of a previously uploaded audio file. **Provide either a URL or a File ID.**',
            required: false,
        }),
        batch: Property.Checkbox({
            displayName: 'Batch Mode (Async)',
            description: 'If true, the job runs asynchronously in the background. Recommended for long audio files.',
            required: false,
            defaultValue: true,
        }),
        callback_url: Property.ShortText({
            displayName: 'Callback URL',
            description: 'An optional URL to send a POST request to when the async job is complete.',
            required: false,
        }),
        metadata: Property.Json({
            displayName: 'Metadata',
            description: 'Optional JSON metadata to pass to the model.',
            required: false,
        }),
        config: Property.Json({
            displayName: 'Config',
            description: 'Optional JSON config for VLM generation.',
            required: false,
        }),
    },
    async run(context) {
        const { domain, url, file_id, batch, callback_url, metadata, config } = context.propsValue;


        if (!url && !file_id) {
            throw new Error("Validation Error: You must provide an 'Audio URL' or a 'File ID'.");
        }

        const requestBody = {
            domain,
            url: url || undefined,
            file_id: file_id || undefined,
            batch,
            callback_url: callback_url || undefined,
            metadata: metadata || undefined,
            config: config || undefined,
        };


        return await makeRequest(
            context.auth,
            HttpMethod.POST,
            '/audio/generate',
            requestBody
        );
    },
});