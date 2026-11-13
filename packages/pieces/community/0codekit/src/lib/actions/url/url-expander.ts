import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const urlExpanderAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'url_expander',
    classification: 'READ',
    displayName: 'URL Expander',
    description: 'Find the full URL behind a short link from any URL shortener.',
    audience: 'both',
    aiMetadata: {
        description:
            'Follow a shortened URL from any URL shortener (bit.ly, lyl.ai, t.co and similar) and return the full URL it redirects to. Does not change anything. Safe to retry, though the result can change if the short link is re-pointed.',
        idempotent: true,
    },
    props: {
        url: Property.ShortText({
            displayName: 'Short URL',
            description: 'The shortened URL to expand, for example `https://bit.ly/abc123`.',
            required: true,
            placeholder: 'https://bit.ly/abc123',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.urlExpander,
    async run({ auth, propsValue }) {
        const url = propsValue.url.trim();
        const response = await zeroCodeKitApi.post<UrlExpanderResponse>({
            apiKey: auth.secret_text,
            path: '/operator/urlexpander',
            body: {
                url,
            },
        });
        return {
            short_url: url,
            expanded_url: response.unshortenedUrl ?? null,
        };
    },
});

type UrlExpanderResponse = {
    unshortenedUrl?: string;
};
