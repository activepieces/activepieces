import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
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
import { findUsersAction } from './lib/actions/find-users';
import { listGroupsAction } from './lib/actions/list-groups';
import { listUserGroupsAction } from './lib/actions/list-user-groups';
import { removeMemberFromGroupAction } from './lib/actions/remove-member-from-group';
import { updateGroupAction } from './lib/actions/update-group';
import { setUserAccountEnabledAction } from './lib/actions/set-user-account-enabled';
import { setUserManagerAction } from './lib/actions/set-user-manager';
import { listSubscribedSkusAction } from './lib/actions/list-subscribed-skus';
import { newDeletedUserTrigger } from './lib/triggers/new-deleted-user';
import { newGroupTrigger } from './lib/triggers/new-group';
import { newUserTrigger } from './lib/triggers/new-user';

export const azureAd = createPiece({
    displayName: 'Azure Active Directory',
    description: 'Manage users, groups, and licenses in Microsoft Entra ID via Microsoft Graph.',
    minimumSupportedRelease: '0.88.2',
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
        findUsersAction,
        listGroupsAction,
        listUserGroupsAction,
        removeMemberFromGroupAction,
        updateGroupAction,
        setUserAccountEnabledAction,
        setUserManagerAction,
        listSubscribedSkusAction,
        createCustomApiCallAction({
            auth: azureAdAuth,
            baseUrl: () => 'https://graph.microsoft.com/v1.0',
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.access_token}`,
            }),
        }),
    ],
    triggers: [
        newDeletedUserTrigger,
        newGroupTrigger,
        newUserTrigger,
    ],
});
