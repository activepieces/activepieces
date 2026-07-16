import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';

export const confirmRiskScoreDisclaimer = createAction({
    name: 'confirm_risk_score_disclaimer',
    auth: firmaradarAuth,
    displayName: 'Confirm Risk Score Disclaimer',
    description:
        'One-time confirmation of the risk-scoring pre-screening disclaimer via ' +
        'API (idempotent). Fetch the exact disclaimer text and version from ' +
        'GET /api/v1/risikoscoring/disclaimer, then confirm here — after that, ' +
        '"Get Risk Score" stops returning kundebekreftelse_required.',
    props: {
        version: Property.ShortText({
            displayName: 'Disclaimer Version',
            description: 'Must match the current disclaimer version, e.g. v1.',
            required: true,
        }),
        confirmation: Property.LongText({
            displayName: 'Disclaimer Text',
            description:
                'Exact disclaimer text (full-text match) as returned by the ' +
                'disclaimer endpoint.',
            required: true,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/risikoscoring/confirm-disclaimer',
            body: {
                version: context.propsValue.version,
                confirmation: context.propsValue.confirmation,
            },
        });
    },
});
