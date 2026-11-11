import { createAction, Property } from '@activepieces/pieces-framework';
import { jobspipeAuth } from '../auth';
import { makeJobsPipeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getCompanyProfileAction = createAction({
    auth: jobspipeAuth,
    name: 'get_company_profile',
    classification: 'READ',
    displayName: 'Get Company Profile',
    description: 'Look up enriched company profile by domain, name, or email.',
    audience: 'both',
    aiMetadata: {
        description:
            'Fetch enriched company record (domain, website, logo, headcount, headquarters, description, LinkedIn, founding year) by domain (stripe.com), careers URL, email, or company name. Costs 1 credit when record is returned, nothing on 404. Safe to retry.',
        idempotent: true,
    },
    props: {
        key: Property.ShortText({
            displayName: 'Company Key',
            description: 'Company domain (e.g. "stripe.com"), careers URL, email, or exact company name.',
            required: true,
        }),
    },
    async run(context) {
        const { key } = context.propsValue;

        const response = await makeJobsPipeRequest<{
            key: string;
            name: string;
            domain: string;
            url: string;
            logo: string | null;
            employee_count: number | null;
            linkedin_url: string | null;
            description: string | null;
            location: {
                street: string | null;
                city: string | null;
                region: string | null;
                postal_code: string | null;
                country: string | null;
            };
            founded: string | null;
        }>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.GET,
            path: `/v1/companies/${encodeURIComponent(key)}`,
        });

        return response;
    },
});
