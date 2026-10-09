import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { datacircleAuth } from '../auth';
import { datacircleRequest } from '../common';

export const getBalanceAction = createAction({
    auth: datacircleAuth,
    name: 'get_balance',
    displayName: 'Get Balance',
    description: 'Read your Datacircle balance in USD, and what it is made of: the signup credit, temporary credits and the funds you added. Free.',
    props: {},
    async run({ auth }) {
        return datacircleRequest<unknown>({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/balance/',
        });
    },
});
