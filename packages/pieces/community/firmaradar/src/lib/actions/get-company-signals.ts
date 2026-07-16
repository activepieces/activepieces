import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getCompanySignals = createAction({
    name: 'get_company_signals',
    auth: firmaradarAuth,
    displayName: 'Get Company Signals',
    description:
        'Aggregated risk and growth signals — KYC announcements, financial ' +
        'distress (FIV), hiring signals, merger relations, funding, beneficial ' +
        'owners — one call for a portfolio-monitoring verdict.',
    props: {
        orgnr: orgnrProp(),
        since: Property.ShortText({
            displayName: 'Since Date',
            description:
                'ISO date (YYYY-MM-DD). Overrides the default 730-day lookback ' +
                '(capped at 1825 days).',
            required: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/company/${context.propsValue.orgnr}/signals`,
            query: {
                since: context.propsValue.since,
            },
        });
    },
});
