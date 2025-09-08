import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const generateImageFromText = createAction({
    auth: runwayAuth,
    name: 'generate_image_from_text',
    displayName: 'Generate Image From Text',
    description: 'Generates an image using a text prompt via Runway’s AI models.',
    props: {
        promptText: Property.LongText({
            displayName: 'Prompt',
            description: 'A detailed description of the desired image output.',
            required: true,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The model variant to use for generation.',
            required: true,
            options: {
                options: [
                    { label: 'gen4_image', value: 'gen4_image' },
                    { label: 'gen4_image_turbo', value: 'gen4_image_turbo' },
                ],
            },
            defaultValue: 'gen4_image',
        }),
        ratio: Property.StaticDropdown({
            displayName: 'Aspect Ratio',
            description: 'The resolution and aspect ratio of the output image.',
            required: true,
            options: {
                options: [
                    { label: '1920:1080 (16:9)', value: '1920:1080' },
                    { label: '1080:1920 (9:16)', value: '1080:1920' },
                    { label: '1024:1024 (1:1)', value: '1024:1024' },
                    { label: '1360:768', value: '1360:768' },
                    { label: '1280:720 (16:9)', value: '1280:720' },
                    { label: '720:1280 (9:16)', value: '720:1280' },
                ],
            },
            defaultValue: '1920:1080',
        }),
        seed: Property.Number({
            displayName: 'Seed',
            description: 'A seed for deterministic generation. If unspecified, a random number is chosen.',
            required: false,
        }),
        publicFigureThreshold: Property.StaticDropdown({
            displayName: 'Public Figure Threshold',
            description: 'Affects the behavior of the content moderation system.',
            required: false,
            options: {
                options: [
                    { label: 'Auto', value: 'auto' },
                    { label: 'Low', value: 'low' },
                ],
            },
            defaultValue: 'auto',
        }),
    },
    async run({ auth, propsValue }) {
        const { promptText, model, ratio, seed, publicFigureThreshold } = propsValue;

        const response = await httpClient.sendRequest({
            url: `https://api.runwayml.com/v1/text_to_image`,
            method: HttpMethod.POST,
            headers: {
                'Authorization': `Bearer ${auth}`,
                'X-Runway-Version': '2024-11-06',
                'Content-Type': 'application/json',
            },
            body: {
                promptText,
                model,
                ratio,
                seed,
                contentModeration: {
                    publicFigureThreshold,
                },
            },
        });

       
        return response.body;
    },
});