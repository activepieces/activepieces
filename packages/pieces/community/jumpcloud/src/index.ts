import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from './lib/auth';
import { jumpcloudApi } from './lib/common/client';

export const jumpcloud = createPiece({
    displayName: 'JumpCloud',
    description: 'Manage JumpCloud users, devices, groups and applications.',
    minimumSupportedRelease: '0.88.2',
    logoUrl: 'https://raw.githubusercontent.com/eliseukadesh67/activepieces/feat/jumpcloud/packages/pieces/community/jumpcloud/jumpcloud.png',
    categories: [PieceCategory.DEVELOPER_TOOLS],
    auth: jumpcloudAuth,
    authors: ['eliseukadesh67'],
    actions: [
        createCustomApiCallAction({
            auth: jumpcloudAuth,
            description: 'Call any JumpCloud API endpoint with this connection. Use a path such as /systemusers for the v1 API or /v2/usergroups for the v2 API.',
            baseUrl: (auth) => (auth === undefined ? '' : jumpcloudApi.resolveBaseUrl(auth.props)),
            authMapping: async (auth) => jumpcloudApi.authHeaders(auth.props),
        }),
    ],
    triggers: [],
});
