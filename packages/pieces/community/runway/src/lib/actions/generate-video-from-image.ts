import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const generateVideoFromImage = createAction({
    auth: runwayAuth,
    name: 'generate_video_from_image',
    displayName: 'Generate Video from Image',
    description: 'Generates a video based on an image and an optional text prompt.',
    props: {
        promptImage: Property.ShortText({
            displayName: 'Image URL',
            description: 'A direct HTTPS URL or a data URI for the source image.',
            required: true,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The model variant to use.',
            required: true,
            options: {
                options: [
                    { label: 'gen4_turbo', value: 'gen4_turbo' },
                    { label: 'gen3a_turbo', value: 'gen3a_turbo' },
                ],
            },
            defaultValue: 'gen4_turbo',
        }),
        ratio: Property.StaticDropdown({
            displayName: 'Aspect Ratio',
            description: 'The resolution and aspect ratio of the output video.',
            required: true,
            options: {
                options: [
                    { label: '1280:720 (16:9)', value: '1280:720' },
                    { label: '720:1280 (9:16)', value: '720:1280' },
                    { label: '1104:832', value: '1104:832' },
                    { label: '832:1104', value: '832:1104' },
                    { label: '960:960 (1:1)', value: '960:960' },
                    { label: '1584:672', value: '1584:672' },
                    { label: '1280:768', value: '1280:768' },
                    { label: '768:1280', value: '768:1280' },
                ],
            },
            defaultValue: '1280:720',
        }),
        promptText: Property.LongText({
            displayName: 'Prompt (Optional)',
            description: 'An optional text description of the desired video output.',
            required: false,
        }),
        duration: Property.StaticDropdown({
            displayName: 'Duration (seconds)',
            description: 'The duration of the output video in seconds.',
            required: false,
            options: {
                options: [
                    { label: '5 seconds', value: 5 },
                    { label: '10 seconds', value: 10 },
                ]
            }
        }),
        seed: Property.Number({
            displayName: 'Seed (Optional)',
            description: 'A seed for deterministic generation. If unspecified, a random number is chosen.',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const { promptImage, model, ratio, promptText, duration, seed } = propsValue;

        const requestBody: Record<string, unknown> = {
            promptImage,
            model,
            ratio,
        };
        
        if (promptText) requestBody['promptText'] = promptText;
        if (duration) requestBody['duration'] = duration;
        if (seed) requestBody['seed'] = seed;

        const response = await httpClient.sendRequest({
            url: `https://api.runwayml.com/v1/image_to_video`,
            method: HttpMethod.POST,
            headers: {
                'Authorization': `Bearer ${auth}`,
                'X-Runway-Version': '2024-11-06',
                'Content-Type': 'application/json',
            },
            body: requestBody,
        });

        return response.body;
    },
});