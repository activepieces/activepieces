import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createSocialMediaCaption = createAction({
    name: 'create_social_media_caption',
    displayName: 'Create Social Media Caption',
    description: 'Generate a caption tailored for a specific social media channel.',
    props: {
        mode: Property.StaticDropdown({
            displayName: 'Social Media Channel',
            description: 'The platform to generate the post for.',
            required: true,
            options: {
                options: [
                    { label: 'Twitter', value: 'twitter' },
                    { label: 'LinkedIn', value: 'linkedin' },
                ]
            }
        }),
        context: Property.LongText({
            displayName: 'Context / Topic',
            description: 'What the social media post should be about.',
            required: true,
        }),
        keywords: Property.Array({
            displayName: 'Keywords',
            description: 'Keywords to include in the post (e.g., "AI", "automation").',
            required: false,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use.',
            required: false,
            options: {
                options: [
                    { label: "Gemini 2.0 Flash (Default)", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
                    { label: "Grok 2", value: "grok-2" },
                ]
            }
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Higher values are more creative.',
            required: false,
        }),
        max_tokens: Property.Number({
            displayName: 'Max Tokens',
            description: 'The maximum number of tokens to generate for the caption.',
            required: false,
        }),
    },
    async run(context) {
        const { mode, context: postContext, keywords, model, temperature, max_tokens } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/social-media-posts',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                mode,
                context: postContext, // Renamed to avoid conflict with 'context' object
                keywords,
                model,
                temperature,
                max_tokens,
            },
        });

        return response.body;
    },
});