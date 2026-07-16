import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { cursorProp, limitProp } from '../common/props';

export const listCompaniesInNace = createAction({
    name: 'list_companies_in_nace',
    auth: firmaradarAuth,
    displayName: 'List Companies in Industry (NACE)',
    description:
        'All companies in a NACE industry code (prefix match) with status, ' +
        'municipality and size filters — build market lists and monitoring ' +
        'portfolios by industry.',
    props: {
        code: Property.ShortText({
            displayName: 'NACE Code',
            description: 'Industry code or prefix, e.g. 47, 47.11 or 47.110.',
            required: true,
        }),
        status: Property.StaticDropdown({
            displayName: 'Company Status',
            required: false,
            options: {
                options: [
                    { label: 'Active', value: 'aktiv' },
                    { label: 'Bankrupt', value: 'konkurs' },
                    { label: 'Being dissolved', value: 'under_avvikling' },
                    { label: 'Deregistered', value: 'avregistrert' },
                ],
            },
        }),
        kommune: Property.ShortText({
            displayName: 'Municipality Code',
            description: 'Four-digit Norwegian municipality code, e.g. 0301.',
            required: false,
        }),
        minAnsatte: Property.Number({
            displayName: 'Minimum Employees',
            required: false,
        }),
        maxAnsatte: Property.Number({
            displayName: 'Maximum Employees',
            required: false,
        }),
        includeTotal: Property.Checkbox({
            displayName: 'Include Total Count',
            required: false,
            defaultValue: false,
        }),
        limit: limitProp(50, 200),
        cursor: cursorProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/nace/${encodeURIComponent(context.propsValue.code)}/companies`,
            query: {
                status: context.propsValue.status,
                kommune: context.propsValue.kommune,
                min_ansatte: context.propsValue.minAnsatte,
                max_ansatte: context.propsValue.maxAnsatte,
                include_total: context.propsValue.includeTotal ? 1 : undefined,
                limit: context.propsValue.limit,
                cursor: context.propsValue.cursor,
            },
        });
    },
});
