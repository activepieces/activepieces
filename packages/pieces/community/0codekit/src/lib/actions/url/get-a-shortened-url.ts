import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const getAShortenedUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_a_shortened_url',
    classification: 'READ',
    displayName: 'Get a Shortened Url',
    description: 'Find out where one of your short links redirects to.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the destination URL of one shortened URL, identified by its identifier, from the connected 0CodeKit account, together with the full short URL. Only links created with this account are visible. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        identifier: zeroCodeKitUrl.shortenedUrlIdentifier({
            description: 'The short link to look up.',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.shortenedUrl,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<GetShortenedUrlResponse>({
            apiKey: auth.secret_text,
            path: '/generate/shortenedurl/get',
            body: {
                identifier: propsValue.identifier,
            },
        });
        return {
            identifier: propsValue.identifier,
            short_url: zeroCodeKitUrl.shortUrlOf(propsValue.identifier),
            destination: response.destination ?? null,
        };
    },
});

type GetShortenedUrlResponse = {
    destination?: string;
};
