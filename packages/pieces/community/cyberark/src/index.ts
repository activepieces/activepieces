import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cyberarkAuth } from './lib/common/auth';
import { createUser } from './lib/actions/create-user';
import { updateUser } from './lib/actions/update-user';
import { deleteUser } from './lib/actions/delete-user';
import { activateUser } from './lib/actions/activate-user';
import { enableUser } from './lib/actions/enable-user';
import { disableUser } from './lib/actions/disable-user';
import { findUser } from './lib/actions/find-user';
import { addMemberToGroup } from './lib/actions/add-member-to-group';
import { removeUserFromGroup } from './lib/actions/remove-user-from-group';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const cyberark = createPiece({
    displayName: 'CyberArk',
    description: 'Identity security platform for protecting critical assets',
    auth: cyberarkAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/cyberark.png',
    authors: ['owuzo'],
    categories: [PieceCategory.PRODUCTIVITY],
    actions: [
        createUser,
        updateUser,
        deleteUser,
        activateUser,
        enableUser,
        disableUser,
        findUser,
        addMemberToGroup,
        removeUserFromGroup,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                const baseUrl = (auth as any).baseUrl.replace(/\/$/, '');
                return `${baseUrl}/PasswordVault/API`;
            },
            auth: cyberarkAuth,
            authMapping: async (auth) => {
                const client = await import('./lib/common/client');
                const cyberarkClient = client.createCyberArkClient(auth as any);
                const token = await cyberarkClient.authenticate();
                return {
                    Authorization: token,
                };
            },
        }),
    ],
    triggers: [],
});
