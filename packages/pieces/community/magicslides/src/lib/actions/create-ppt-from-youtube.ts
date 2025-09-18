import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { magicslidesAuth } from '../common/auth';

export const createPptFromYoutube = createAction({
    auth: magicslidesAuth,
    name: 'create_ppt_from_youtube',
    displayName: 'Create PPT from YouTube Video',
    description: 'Creates a presentation from a given YouTube video URL.',
    props: {
        youtubeURL: Property.ShortText({
            displayName: 'YouTube URL',
            description: 'The URL of the YouTube video to convert into a presentation.',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Your registered MagicSlides email address.',
            required: true,
        }),
        slideCount: Property.Number({
            displayName: 'Number of Slides',
            description: 'The number of slides to generate (between 1 and 50).',
            required: false,
            defaultValue: 10,
        }),
        template: Property.StaticDropdown({
            displayName: 'Template',
            description: 'The visual style of the presentation.',
            required: false,
            options: {
                options: [
                    { label: "Default Bullet Point 1", value: "bullet-point1" },
                    { label: "Editable Bullet Point 1", value: "ed-bullet-point1" },
                    { label: "Pitch Deck Original", value: "pitchdeckorignal" },
                    { label: "Custom Dark 1", value: "custom Dark 1" },
                    { label: "Custom Sync 1", value: "custom sync 1" },
                    { label: "Default Bullet Point 2", value: "bullet-point2" },
                ]
            }
        }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'Target language for the presentation (e.g., "en", "es", "fr").',
            required: false,
            defaultValue: "en"
        }),
        model: Property.StaticDropdown({
            displayName: 'AI Model',
            description: 'The AI model to use for content generation.',
            required: false,
            defaultValue: "gpt-4",
            options: {
                options: [
                    { label: 'GPT-4', value: 'gpt-4' },
                    { label: 'GPT-3.5', value: 'gpt-3.5' },
                ],
            },
        }),
        aiImages: Property.Checkbox({
            displayName: 'AI Images',
            description: 'Enable AI-generated images for the slides.',
            required: false,
            defaultValue: false
        }),
        imageForEachSlide: Property.Checkbox({
            displayName: 'Image for Each Slide',
            description: 'Ensure every slide includes an image.',
            required: false,
            defaultValue: true
        }),
        googleImage: Property.Checkbox({
            displayName: 'Use Google Images',
            description: 'Use Google Images instead of AI-generated images.',
            required: false,
            defaultValue: false
        }),
        googleText: Property.Checkbox({
            displayName: 'Use Google Text',
            description: 'Enhance content using Google search results.',
            required: false,
            defaultValue: false
        }),
        presentationFor: Property.ShortText({
            displayName: 'Target Audience',
            description: 'Specify the target audience for the presentation.',
            required: false,
        }),
        watermark: Property.Json({
            displayName: 'Watermark',
            description: 'Add a watermark. e.g., {"width": "48", "height": "48", "brandURL": "https://...png", "position": "BottomRight"}',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;

        // Manual validation for slideCount
        const { slideCount } = propsValue;
        if (slideCount !== undefined && (slideCount < 1 || slideCount > 50)) {
            throw new Error('The number of slides must be between 1 and 50.');
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.magicslides.app/public/api/ppt_from_youtube',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                accessId: auth,
                ...propsValue,
            },
        });

        return response.body;
    },
});