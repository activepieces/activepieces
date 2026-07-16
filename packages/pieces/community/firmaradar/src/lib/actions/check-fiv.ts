import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const checkFiv = createAction({
    name: 'check_foretak_i_vanskeligheter',
    auth: firmaradarAuth,
    displayName: 'Check Company in Difficulty (FIV)',
    description:
        'Deterministic "company in difficulty" assessment under the statutory ' +
        'a-e rules (based on the latest accounts + interim-balance overlay) — ' +
        'required for state-aid eligibility checks and useful as a distress flag.',
    props: {
        orgnr: orgnrProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/fiv/assess/${context.propsValue.orgnr}`,
        });
    },
});
