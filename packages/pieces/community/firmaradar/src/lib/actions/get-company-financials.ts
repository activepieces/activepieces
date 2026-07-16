import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getCompanyFinancials = createAction({
    name: 'get_company_financials',
    auth: firmaradarAuth,
    displayName: 'Get Company Financials',
    description:
        'Annual accounts and key figures (revenue, operating result, equity, debt) ' +
        'for credit assessment and financial health checks.',
    props: {
        orgnr: orgnrProp(),
        years: Property.Number({
            displayName: 'Years Back',
            description: 'Number of financial years to include (1-10).',
            required: false,
            defaultValue: 5,
        }),
        regnskapstype: Property.StaticDropdown({
            displayName: 'Statement Type',
            required: false,
            defaultValue: 'SELSKAP',
            options: {
                options: [
                    { label: 'Company (SELSKAP)', value: 'SELSKAP' },
                    { label: 'Group (KONSERN)', value: 'KONSERN' },
                ],
            },
        }),
        skipFreshness: Property.Checkbox({
            displayName: 'Skip Freshness Check',
            description:
                'Accept cached figures even if the underlying snapshot is older ' +
                'than the normal freshness window (retrospective analysis).',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/regnskap/${context.propsValue.orgnr}/historikk`,
            query: {
                years: context.propsValue.years,
                regnskapstype: context.propsValue.regnskapstype,
                skip_freshness: context.propsValue.skipFreshness ? 1 : undefined,
            },
        });
    },
});
