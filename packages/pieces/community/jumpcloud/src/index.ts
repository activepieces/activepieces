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
import { newObjectTrigger } from './lib/triggers/new-object';

export const jumpcloud = createPiece({
    displayName: 'JumpCloud',
    description: 'Manage JumpCloud users, devices, groups and applications.',
    minimumSupportedRelease: '0.88.2',
    logoUrl: 'https://cdn.activepieces.com/pieces/jumpcloud.png',
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
            authMapping: async (auth, propsValue) => {
                assertJumpcloudUrl({ baseUrl: jumpcloudApi.resolveBaseUrl(auth.props), url: readUrl(propsValue) });
                return jumpcloudApi.authHeaders(auth.props);
            },
        }),
    ],
    triggers: [newObjectTrigger],
});

// The admin key must only reach the connection's JumpCloud host, never a full URL pointing elsewhere.
function assertJumpcloudUrl({ baseUrl, url }: { baseUrl: string; url: string }): void {
    const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
    if (isAbsolute && new URL(url).origin !== new URL(baseUrl).origin) {
        throw new Error(`Custom API Call only sends this connection to ${new URL(baseUrl).origin}. Use a path such as /systemusers.`);
    }
}

function readUrl(propsValue: Record<string, unknown>): string {
    const url = propsValue['url'];
    if (url !== null && typeof url === 'object' && 'url' in url && typeof url.url === 'string') {
        return url.url;
    }
    return '';
}
