import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const listShortenedUrlsAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'list_shortened_urls',
    classification: 'SEARCH',
    displayName: 'List Shortened Urls',
    description: 'Get every short link created with your 0CodeKit account.',
    audience: 'both',
    aiMetadata: {
        description:
            'List all shortened URLs in the connected 0CodeKit account, each with its identifier, full short URL, destination URL and creation date, plus the total count. Takes no input. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {},
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.listShortenedUrls,
    async run({ auth }) {
        const urls = await zeroCodeKitUrl.listShortenedUrls(auth.secret_text);
        return {
            count: urls.length,
            shortened_urls: urls.map(zeroCodeKitUrl.toShortenedUrl),
        };
    },
});
