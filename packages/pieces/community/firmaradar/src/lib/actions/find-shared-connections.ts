import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest } from '../common/client';
import { parseOrgnrs } from '../common/parse';
import { orgnrsProp } from '../common/props';

export const findSharedConnections = createAction({
    name: 'find_shared_connections',
    auth: firmaradarAuth,
    displayName: 'Find Shared Connections',
    description:
        'Cross-company network analysis: common persons, addresses, owners, ' +
        'auditor and parent companies plus circular-ownership indicators with a ' +
        'combined score — uncover hidden links between 2 or more counterparties. ' +
        'Requires the koblingsanalyse extension.',
    props: {
        orgnrs: orgnrsProp(10, 'Two or more nine-digit organisation numbers to analyse.'),
    },
    async run(context) {
        return firmaradarRequest(context.auth, {
            method: HttpMethod.GET,
            path: '/api/v1/find-shared-connections',
            query: {
                orgnrs: parseOrgnrs(context.propsValue.orgnrs).join(','),
            },
        });
    },
});
