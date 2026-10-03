import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getAccessToken, googleWorkspaceAdminAuth } from './lib/auth';
import { createUser } from './lib/actions/create-user';
import { updateUser } from './lib/actions/update-user';
import { getUser } from './lib/actions/get-user';
import { searchUsers } from './lib/actions/search-users';
import { deleteUser } from './lib/actions/delete-user';
import { suspendUser } from './lib/actions/suspend-user';
import { unsuspendUser } from './lib/actions/unsuspend-user';
import { makeUserAdmin } from './lib/actions/make-user-admin';
import { revokeUserAdmin } from './lib/actions/revoke-user-admin';
import { addUserAlias } from './lib/actions/add-user-alias';
import { listUserAliases } from './lib/actions/list-user-aliases';
import { deleteUserAlias } from './lib/actions/delete-user-alias';
import { createGroup } from './lib/actions/create-group';
import { updateGroup } from './lib/actions/update-group';
import { getGroup } from './lib/actions/get-group';
import { searchGroups } from './lib/actions/search-groups';
import { deleteGroup } from './lib/actions/delete-group';
import { addGroupMember } from './lib/actions/add-group-member';
import { updateGroupMember } from './lib/actions/update-group-member';
import { getGroupMember } from './lib/actions/get-group-member';
import { listGroupMembers } from './lib/actions/list-group-members';
import { removeGroupMember } from './lib/actions/remove-group-member';
import { createOrgUnit } from './lib/actions/create-org-unit';
import { updateOrgUnit } from './lib/actions/update-org-unit';
import { getOrgUnit } from './lib/actions/get-org-unit';
import { listOrgUnits } from './lib/actions/list-org-units';
import { deleteOrgUnit } from './lib/actions/delete-org-unit';
import { listRoles } from './lib/actions/list-roles';
import { assignRole } from './lib/actions/assign-role';
import { getRoleAssignment } from './lib/actions/get-role-assignment';
import { listRoleAssignments } from './lib/actions/list-role-assignments';
import { deleteRoleAssignment } from './lib/actions/delete-role-assignment';
import { generateVerificationCodes } from './lib/actions/generate-verification-codes';
import { listVerificationCodes } from './lib/actions/list-verification-codes';
import { invalidateVerificationCodes } from './lib/actions/invalidate-verification-codes';
import { listAppPasswords } from './lib/actions/list-app-passwords';
import { getAppPassword } from './lib/actions/get-app-password';
import { deleteAppPassword } from './lib/actions/delete-app-password';
import { listTokens } from './lib/actions/list-tokens';
import { getToken } from './lib/actions/get-token';
import { deleteToken } from './lib/actions/delete-token';
import { assignLicense } from './lib/actions/assign-license';
import { getLicense } from './lib/actions/get-license';
import { listLicenses } from './lib/actions/list-licenses';
import { reassignLicense } from './lib/actions/reassign-license';
import { revokeLicense } from './lib/actions/revoke-license';
import { listMobileDevices } from './lib/actions/list-mobile-devices';
import { mobileDeviceAction } from './lib/actions/mobile-device-action';
import { deleteMobileDevice } from './lib/actions/delete-mobile-device';
import { transferUserData } from './lib/actions/transfer-user-data';
import { newUserEvent } from './lib/triggers/new-user-event';
import { newUser } from './lib/triggers/new-user';
import { newGroup } from './lib/triggers/new-group';
import { newAdminActivityEvent } from './lib/triggers/new-admin-activity-event';
import { newApplicationActivityEvent } from './lib/triggers/new-application-activity-event';

export const googleWorkspaceAdmin = createPiece({
  displayName: 'Google Workspace Admin',
  description: 'Manage Google Workspace users, groups, organizational units, admin roles, licenses and devices.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-workspace-admin.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: googleWorkspaceAdminAuth,
  authors: ['kishanprmr'],
  actions: [
    createUser,
    updateUser,
    getUser,
    searchUsers,
    deleteUser,
    suspendUser,
    unsuspendUser,
    makeUserAdmin,
    revokeUserAdmin,
    addUserAlias,
    listUserAliases,
    deleteUserAlias,
    createGroup,
    updateGroup,
    getGroup,
    searchGroups,
    deleteGroup,
    addGroupMember,
    updateGroupMember,
    getGroupMember,
    listGroupMembers,
    removeGroupMember,
    createOrgUnit,
    updateOrgUnit,
    getOrgUnit,
    listOrgUnits,
    deleteOrgUnit,
    listRoles,
    assignRole,
    getRoleAssignment,
    listRoleAssignments,
    deleteRoleAssignment,
    generateVerificationCodes,
    listVerificationCodes,
    invalidateVerificationCodes,
    listAppPasswords,
    getAppPassword,
    deleteAppPassword,
    listTokens,
    getToken,
    deleteToken,
    assignLicense,
    getLicense,
    listLicenses,
    reassignLicense,
    revokeLicense,
    listMobileDevices,
    mobileDeviceAction,
    deleteMobileDevice,
    transferUserData,
    createCustomApiCallAction({
      baseUrl: () => 'https://admin.googleapis.com',
      auth: googleWorkspaceAdminAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(auth)}`,
      }),
    }),
  ],
  triggers: [
    newUserEvent,
    newUser,
    newGroup,
    newAdminActivityEvent,
    newApplicationActivityEvent,
  ],
});
