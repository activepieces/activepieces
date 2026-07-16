import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { parseOrgnrs } from '../common/parse';
import { orgnrsProp } from '../common/props';

export const getRiskScoreBulk = createAction({
    name: 'get_risk_score_bulk',
    auth: firmaradarAuth,
    displayName: 'Get Risk Score (Bulk)',
    description:
        'Portfolio risk-scoring of up to 50 companies in one call — each orgnr is ' +
        'scored in parallel and returned with its own result or per-orgnr error. ' +
        'Ideal for scheduled supplier- or portfolio-screening flows.',
    props: {
        orgnrs: orgnrsProp(50),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/risikoscoring/score/bulk',
            body: {
                orgnrs: parseOrgnrs(context.propsValue.orgnrs),
            },
        });
    },
});
