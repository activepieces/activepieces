import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const utmBuildAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'utm_build',
    classification: 'READ',
    displayName: 'UTM Build',
    description: 'Add UTM tracking parameters to a URL.',
    audience: 'both',
    aiMetadata: {
        description:
            'Build a campaign tracking link by adding UTM parameters (utm_source, utm_medium, utm_campaign, utm_content, utm_term) to a base URL, and return the resulting URL. Empty parameters are left out. Pure transformation with no side effects; safe to retry.',
        idempotent: true,
    },
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The page the link should open.',
            required: true,
            placeholder: 'https://example.com/pricing',
        }),
        utmSource: Property.ShortText({
            displayName: 'Source (utm_source)',
            description: 'Where the traffic comes from, for example `newsletter` or `google`.',
            required: true,
        }),
        utmMedium: Property.ShortText({
            displayName: 'Medium (utm_medium)',
            description: 'The marketing channel, for example `email` or `cpc`.',
            required: false,
        }),
        utmCampaign: Property.ShortText({
            displayName: 'Campaign (utm_campaign)',
            description: 'The campaign name, for example `spring_sale`.',
            required: false,
        }),
        utmContent: Property.ShortText({
            displayName: 'Content (utm_content)',
            description: 'Tells apart links in the same campaign, for example `header_button`.',
            required: false,
        }),
        utmTerm: Property.ShortText({
            displayName: 'Term (utm_term)',
            description: 'The paid search keyword, if any.',
            required: false,
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.utmBuild,
    async run({ auth, propsValue }) {
        const utm = Object.fromEntries(
            Object.entries({
                utm_source: propsValue.utmSource,
                utm_medium: propsValue.utmMedium,
                utm_campaign: propsValue.utmCampaign,
                utm_content: propsValue.utmContent,
                utm_term: propsValue.utmTerm,
            })
                .map(([key, value]) => [key, value?.trim()])
                .filter(([, value]) => value !== undefined && value !== ''),
        );
        const response = await zeroCodeKitApi.post<UtmBuildResponse>({
            apiKey: auth.secret_text,
            path: '/operator/utm/build',
            body: {
                url: propsValue.url.trim(),
                utm,
            },
        });
        return {
            url: response.url ?? null,
        };
    },
});

type UtmBuildResponse = {
    url?: string;
};
