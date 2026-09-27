import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const updateShortenedUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'update_shortened_url',
    classification: 'WRITE',
    displayName: 'Update Shortened Url',
    description: 'Change where one of your short links redirects to.',
    audience: 'both',
    aiMetadata: {
        description:
            'Point an existing shortened URL, identified by its identifier, at a new destination URL. The short link itself does not change. Only links created with this account can be updated. Setting the same destination again has the same result, so it is safe to retry.',
        idempotent: true,
    },
    props: {
        identifier: zeroCodeKitUrl.shortenedUrlIdentifier({
            description: 'The short link to change.',
        }),
        destination: Property.ShortText({
            displayName: 'New Destination URL',
            description: 'The full URL the short link redirects to from now on.',
            required: true,
            placeholder: 'https://example.com/new-page',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.shortenedUrl,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<UpdateShortenedUrlResponse>({
            apiKey: auth.secret_text,
            path: '/generate/shortenedurl/put',
            body: {
                identifier: propsValue.identifier,
                destination: propsValue.destination.trim(),
            },
        });
        const identifier = response.identifier ?? propsValue.identifier;
        return {
            identifier,
            short_url: zeroCodeKitUrl.shortUrlOf(identifier),
            destination: response.newDestination ?? propsValue.destination.trim(),
        };
    },
});

type UpdateShortenedUrlResponse = {
    newDestination?: string;
    identifier?: string;
};
