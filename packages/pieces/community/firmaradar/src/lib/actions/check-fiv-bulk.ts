import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { parseOrgnrs } from '../common/parse';
import { orgnrsProp } from '../common/props';

export const checkFivBulk = createAction({
    name: 'check_fiv_bulk',
    auth: firmaradarAuth,
    displayName: 'Check Company in Difficulty (Bulk)',
    description:
        'Portfolio distress-screening ("company in difficulty", statutory a-e ' +
        'rules) of up to 50 companies in one call. Per-orgnr compliance gates are ' +
        'returned as per-orgnr errors — the bulk call itself always succeeds.',
    props: {
        orgnrs: orgnrsProp(50),
        skipFreshness: Property.Checkbox({
            displayName: 'Skip Freshness Check',
            description:
                'Accept FIV data even when the underlying snapshot is older than ' +
                'the normal freshness window (retrospective screening). Use sparingly.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/fiv/bulk',
            body: {
                orgnrs: parseOrgnrs(context.propsValue.orgnrs),
                skip_freshness: context.propsValue.skipFreshness ?? false,
            },
        });
    },
});
