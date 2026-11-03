import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const createCustomShortenedUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'create_custom_shortened_url',
    classification: 'WRITE',
    displayName: 'Create Custom Shortened Url',
    description: 'Create a short lyl.ai link with your own ending that redirects to a URL.',
    audience: 'both',
    aiMetadata: {
        description:
            'Create a new shortened URL on lyl.ai with a chosen identifier (the part after lyl.ai/) that redirects to the given destination URL. The identifier must be globally unique across all 0CodeKit users, so the call fails if it is already taken. Returns the identifier, the full short URL and the destination. Not safe to retry blindly.',
        idempotent: false,
    },
    props: {
        destination: Property.ShortText({
            displayName: 'Destination URL',
            description: 'The full URL the short link should redirect to, including `https://`.',
            required: true,
            placeholder: 'https://example.com/page',
        }),
        custom: Property.ShortText({
            displayName: 'Custom Ending',
            description: 'The text after `lyl.ai/`. It must not already be taken.',
            required: true,
            placeholder: 'summer-sale',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.shortenedUrl,
    async run({ auth, propsValue }) {
        const custom = propsValue.custom.trim();
        if (custom.length === 0) {
            throw new Error('Enter a custom ending for the short link.');
        }
        return zeroCodeKitUrl.createShortenedUrl({
            apiKey: auth.secret_text,
            destination: propsValue.destination,
            custom,
        });
    },
});
