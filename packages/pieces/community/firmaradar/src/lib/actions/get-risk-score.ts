import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getRiskScore = createAction({
    name: 'get_risk_score',
    auth: firmaradarAuth,
    displayName: 'Get Risk Score',
    description:
        'Transparent company risk score (0-100) with level (low/moderate/high/' +
        'critical) and a full component breakdown — company health, not personal ' +
        'credit. Requires the risk-scoring extension and a one-time disclaimer ' +
        'confirmation (see "Confirm Risk Score Disclaimer").',
    props: {
        orgnr: orgnrProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/risikoscoring/score/${context.propsValue.orgnr}`,
        });
    },
});
