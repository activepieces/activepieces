import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const utmParseAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'utm_parse',
    classification: 'READ',
    displayName: 'UTM Parse',
    description: 'Read the UTM tracking parameters from a URL.',
    audience: 'both',
    aiMetadata: {
        description:
            'Extract the UTM parameters (utm_source, utm_medium, utm_campaign, utm_content, utm_term) from a URL. Parameters missing from the URL come back as null. Pure transformation with no side effects; safe to retry.',
        idempotent: true,
    },
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The link with UTM parameters to read.',
            required: true,
            placeholder: 'https://example.com/?utm_source=newsletter&utm_medium=email',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.utmParse,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<UtmParseResponse>({
            apiKey: auth.secret_text,
            path: '/operator/utm/parse',
            body: {
                url: propsValue.url.trim(),
            },
        });
        return {
            utm_source: response.utm_source ?? null,
            utm_medium: response.utm_medium ?? null,
            utm_campaign: response.utm_campaign ?? null,
            utm_content: response.utm_content ?? null,
            utm_term: response.utm_term ?? null,
        };
    },
});

type UtmParseResponse = {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
};
