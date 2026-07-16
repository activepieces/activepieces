import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { cursorProp, limitProp } from '../common/props';

export const searchCompanies = createAction({
    name: 'search_companies',
    auth: firmaradarAuth,
    displayName: 'Search Companies',
    description:
        'Find Norwegian companies by name, industry code (NACE) or municipality — ' +
        'the entry point for KYC onboarding, prospecting and supplier-risk flows.',
    props: {
        q: Property.ShortText({
            displayName: 'Search Text',
            description: 'Free-text search in company names (case-insensitive).',
            required: false,
        }),
        nace: Property.ShortText({
            displayName: 'NACE Code',
            description: 'Industry filter — division (47) or full code (47.110).',
            required: false,
        }),
        kommune: Property.ShortText({
            displayName: 'Municipality Code',
            description: 'Four-digit Norwegian municipality code, e.g. 0301 (Oslo).',
            required: false,
        }),
        limit: limitProp(20, 100),
        cursor: cursorProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/companies/search',
            query: {
                q: context.propsValue.q,
                nace: context.propsValue.nace,
                kommune: context.propsValue.kommune,
                limit: context.propsValue.limit,
                cursor: context.propsValue.cursor,
            },
        });
    },
});
