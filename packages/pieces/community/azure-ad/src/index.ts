import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { azureAdAuth } from './lib/auth';
import { addMemberToGroupAction } from './lib/actions/add-member-to-group';
import { addOrRemoveUserLicenseAction } from './lib/actions/add-or-remove-user-license';
import { createGroupAction } from './lib/actions/create-group';
import { createUserAction } from './lib/actions/create-user';
import { deleteGroupAction } from './lib/actions/delete-group';
import { deleteUserAction } from './lib/actions/delete-user';
import { getEnabledUsersAction } from './lib/actions/get-enabled-users';
import { getGroupByIdAction } from './lib/actions/get-group-by-id';
import { getGroupCustomAttributesAction } from './lib/actions/get-group-custom-attributes';
import { getUserByIdAction } from './lib/actions/get-user-by-id';
import { listEnabledUsersAction } from './lib/actions/list-enabled-users';
import { listGroupMembersAction } from './lib/actions/list-group-members';
import { listUsersAction } from './lib/actions/list-users';
import { resetCustomAttributesAction } from './lib/actions/reset-custom-attributes';
import { revokeSignInSessionAction } from './lib/actions/revoke-sign-in-session';
import { updateUserAction } from './lib/actions/update-user';
import { newDeletedUserTrigger } from './lib/triggers/new-deleted-user';
import { newGroupTrigger } from './lib/triggers/new-group';
import { newUserTrigger } from './lib/triggers/new-user';

export const azureAd = createPiece({
    displayName: 'Azure Active Directory',
    description: 'Manage users, groups, and licenses in Microsoft Entra ID (Azure AD) via Microsoft Graph.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/azure-ad.png',
    categories: [PieceCategory.SALES_AND_CRM],
    authors: ['maurivan', 'sanket-a11y'],
    auth: azureAdAuth,
    actions: [
        addMemberToGroupAction,
        addOrRemoveUserLicenseAction,
        createGroupAction,
        createUserAction,
        deleteGroupAction,
        deleteUserAction,
        getEnabledUsersAction,
        getGroupByIdAction,
        getGroupCustomAttributesAction,
        getUserByIdAction,
        listEnabledUsersAction,
        listGroupMembersAction,
        listUsersAction,
        resetCustomAttributesAction,
        revokeSignInSessionAction,
        updateUserAction,
        createCustomApiCallAction({
            auth: azureAdAuth,
            baseUrl: () => 'https://graph.microsoft.com/v1.0',
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            }),
        }),
    ],
    triggers: [
        newDeletedUserTrigger,
        newGroupTrigger,
        newUserTrigger,
    ],
});
