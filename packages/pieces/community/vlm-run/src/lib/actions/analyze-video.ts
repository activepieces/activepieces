import { createAction, Property } from "@activepieces/pieces-framework";
import { vlmRunAuth, vlmRunCommon } from "../common/common";

export const analyzeVideoAction = createAction({
    auth: vlmRunAuth,
    name: 'analyze_video',
    displayName: 'Analyze Video',
    description: 'Analyze a video file or URL, e.g. extract frames, detect content, etc.',
    props: {
        domain: Property.StaticDropdown({
            displayName: 'Domain',
            description: 'The analysis to perform on the video.',
            required: true,
            options: {
                options: [
                    { label: 'Transcription', value: 'video.transcription' },
                    { label: 'Transcription with Summary', value: 'video.transcription-summary' },
                    { label: 'Product Demo Summary', value: 'video.product-demo-summary' },
                    { label: 'Conferencing Summary', value: 'video.conferencing-summary' },
                    { label: 'Podcast Summary', value: 'video.podcast-summary' },
                    { label: 'Generic Summary', value: 'video.summary' },
                    { label: 'Dashcam Analytics', value: 'video.dashcam-analytics' },
                ],
            },
        }),
        url: Property.ShortText({
            displayName: 'Video URL',
            description: 'The public URL of the video to process. **Provide either a URL or a File ID.**',
            required: false,
        }),
        file_id: Property.ShortText({
            displayName: 'File ID',
            description: 'The ID of a previously uploaded video file. **Provide either a URL or a File ID.**',
            required: false,
        }),
        batch: Property.Checkbox({
            displayName: 'Batch Mode (Async)',
            description: 'If true, the job runs asynchronously in the background. Recommended for long videos.',
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
            throw new Error("Validation Error: You must provide a 'Video URL' or a 'File ID'.");
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

        return await vlmRunCommon.analyzeVideo(context.auth, requestBody);
    },
});