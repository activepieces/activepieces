import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createAssociationAction } from './lib/actions/create-association';
import { createObjectAction } from './lib/actions/create-object';
import { deleteAssociationAction } from './lib/actions/delete-association';
import { deleteObjectAction } from './lib/actions/delete-object';
import { findUserByEmployeeIdAction } from './lib/actions/find-user-by-employee-id';
import { getObjectAction } from './lib/actions/get-object';
import { listObjectsAction } from './lib/actions/list-objects';
import { listObjectsByIdAction } from './lib/actions/list-objects-by-id';
import { lockUserAction } from './lib/actions/lock-user';
import { resetUserMfaAction } from './lib/actions/reset-user-mfa';
import { runTriggerCommandAction } from './lib/actions/run-trigger-command';
import { searchObjectsAction } from './lib/actions/search-objects';
import { unlockUserAction } from './lib/actions/unlock-user';
import { updateObjectAction } from './lib/actions/update-object';
import { updateUserOnSystemAction } from './lib/actions/update-user-on-system';
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
        createObjectAction,
        updateObjectAction,
        deleteObjectAction,
        getObjectAction,
        listObjectsAction,
        listObjectsByIdAction,
        searchObjectsAction,
        createAssociationAction,
        deleteAssociationAction,
        findUserByEmployeeIdAction,
        lockUserAction,
        unlockUserAction,
        resetUserMfaAction,
        updateUserOnSystemAction,
        runTriggerCommandAction,
        createCustomApiCallAction({
            auth: jumpcloudAuth,
            description: 'Call any JumpCloud API endpoint with this connection. Use a path such as /systemusers for the v1 API or /v2/usergroups for the v2 API.',
            baseUrl: (auth) => (auth === undefined ? '' : jumpcloudApi.resolveBaseUrl(auth.props)),
            authMapping: async (auth) => jumpcloudApi.authHeaders(auth.props),
        }),
    ],
    triggers: [],
});
