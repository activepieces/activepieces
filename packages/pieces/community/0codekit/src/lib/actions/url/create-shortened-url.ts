import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const createShortenedUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'create_shortened_url',
    classification: 'WRITE',
    displayName: 'Create Shortened Url',
    description: 'Create a short lyl.ai link that redirects to a URL.',
    audience: 'both',
    aiMetadata: {
        description:
            'Create a new shortened URL on lyl.ai that redirects to the given destination URL, with a random 8-letter identifier. Returns the identifier, the full short URL and the destination. Use the identifier to get, update or delete the link later. Creates a new link on each call, so do not retry blindly.',
        idempotent: false,
    },
    props: {
        destination: Property.ShortText({
            displayName: 'Destination URL',
            description: 'The full URL the short link should redirect to, including `https://`.',
            required: true,
            placeholder: 'https://example.com/page',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.shortenedUrl,
    async run({ auth, propsValue }) {
        return zeroCodeKitUrl.createShortenedUrl({
            apiKey: auth.secret_text,
            destination: propsValue.destination,
        });
    },
});
