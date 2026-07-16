import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { orgnrProp } from '../common/props';

export const getKonsernstotte = createAction({
    name: 'get_konsernstotte',
    auth: firmaradarAuth,
    displayName: 'Get Public Grants (Group)',
    description:
        'Public grants and support through the whole corporate group — NAV, ' +
        'state-aid register, Innovasjon Norge and SkatteFUNN — as a tree with ' +
        'per-company amounts plus a group aggregate on the root node.',
    props: {
        orgnr: orgnrProp(),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: `/api/v1/konsernstotte/oversikt/${context.propsValue.orgnr}`,
        });
    },
});
