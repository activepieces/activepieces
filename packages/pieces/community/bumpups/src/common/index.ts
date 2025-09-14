import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const bumpupsAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `
    1. Log in to your Bumpups account at https://bumpups.com/.
    2. Go to your **Dashboard**.
    2. Go to **Settings**.
    3. Click on the the **API keys** tab.
    3. If you already have a key, copy it, if not generate one.
  `,
    required: true,
});

const baseRequestProperties = {
    url: Property.ShortText({
        displayName: 'Video URL',
        description: 'The YouTube video URL.',
        required: true,
    }),
    model: Property.StaticDropdown({
        displayName: 'Model',
        description: 'The model used for generating the output.',
        required: false,
        defaultValue: 'bump-1.0',
        options: {
            options: [
                { label: 'bump-1.0', value: 'bump-1.0' },
            ],
        },
    }),
    language: Property.StaticDropdown({
        displayName: 'Language',
        description: 'Language code for the response.',
        required: false,
        defaultValue: 'en',
        options: {
            options: [
                { label: 'English', value: 'en' },
                { label: 'Hindi', value: 'hi' },
                { label: 'Spanish', value: 'es' },
                { label: 'Portuguese', value: 'pt' },
                { label: 'Russian', value: 'ru' },
                { label: 'German', value: 'de' },
                { label: 'French', value: 'fr' },
                { label: 'Japanese', value: 'ja' },
                { label: 'Korean', value: 'ko' },
                { label: 'Arabic', value: 'ar' },
            ],
        },
    }),
};

export const bumpupsCommon = {
    baseUrl: 'https://api.bumpups.com',
    endpoints: {
        sendChat: '/chat',
        generateTimestamps: '/general/timestamps',
        generateCreatorDescription: '/creator/description',
        generateCreatorTakeaways: '/creator/takeaways',
        generateCreatorHashtags: '/creator/hashtags',
        generateCreatorTitles: '/creator/titles',
    },
    sendChatProperties: {
        prompt: Property.LongText({
            displayName: 'Prompt',
            description: 'The message or query about the video. Prompts longer than 500 characters will be cut off, and the AI generate response will be based on this truncated input.',
            required: false,
        }),
        output_format: Property.StaticDropdown({
            displayName: 'Device Type',
            description: 'The desired output format.',
            required: false,
            options: {
                options: [
                    { label: 'Text', value: 'text' },
                    { label: 'Mardown', value: 'markdown' },
                ],
            },
        }),
        ...baseRequestProperties,
    },
    generateTimestampsProperties: {
        ...baseRequestProperties,
        timestamps_style: Property.StaticDropdown({
            displayName: 'Timestamp Style',
            description: 'Preferred length of each timestamp.',
            required: false,
            options: {
                options: [
                    { label: 'Long', value: 'long' },
                    { label: 'Short', value: 'short' },
                ],
            },
        }),
    },
    generateCreatorDescriptionProperties: {
        ...baseRequestProperties,
    },
    generateCreatorTakeawaysProperties: {
        ...baseRequestProperties,
        emojis_enabled: Property.Checkbox({
            displayName: 'Enable Emojis',
            description: 'Whether to include emojis in the generated takeaways.',
            required: false,
        }),
    },
    generateCreatorHashtagsProperties: {
        ...baseRequestProperties,
        output_format: Property.StaticDropdown({
            displayName: 'Device Type',
            description: 'The desired output format.',
            required: false,
            options: {
                options: [
                    { label: 'Hashtags', value: 'hashtags' },
                    { label: 'Keywords', value: 'keywords' },
                ],
            },
        }),
    },
    generateCreatorTitlesProperties: {
        ...baseRequestProperties,
    },
};