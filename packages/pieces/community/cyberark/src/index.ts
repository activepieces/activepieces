import {
  createPiece,
  PieceAuth,
  Property
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createUser } from './lib/actions/create-user';
import { updateUser } from './lib/actions/update-user';
import { deleteUser } from './lib/actions/delete-user';
import { activateUser } from './lib/actions/activate-user';
import { enableUser } from './lib/actions/enable-user';
import { disableUser } from './lib/actions/disable-user';
import { findUser } from './lib/actions/find-user';
import { addMemberToGroup } from './lib/actions/add-member-to-group';
import { removeMemberFromGroup } from './lib/actions/remove-member-from-group';
import { getPasswordValue } from './lib/actions/get-password-value';
import { retrievePrivateSSHKey } from './lib/actions/retrieve-private-ssh-key';
import { changeCredentialsInVault } from './lib/actions/change-credentials-in-vault';
import { verifyCredentialsBulk } from './lib/actions/verify-credentials-bulk';
import { changeCredentialsBulk } from './lib/actions/change-credentials-bulk';
import { setNextPasswordBulk } from './lib/actions/set-next-password-bulk';
import { changeCredentialsInVaultBulk } from './lib/actions/change-credentials-in-vault-bulk';
import { reconcileCredentialsBulk } from './lib/actions/reconcile-credentials-bulk';
import { cyberarkAuth } from './lib/auth';

export const cyberark = createPiece({
  displayName: 'CyberArk',
  description: 'Manage users, groups, and access controls in CyberArk Privileged Access Management',
  auth: cyberarkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cyberark.png',
  authors: ['fortunamide', 'onyedikachi-david'],
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
    removeMemberFromGroup,
    getPasswordValue,
    retrievePrivateSSHKey,
    changeCredentialsInVault,
    verifyCredentialsBulk,
    changeCredentialsBulk,
    setNextPasswordBulk,
    changeCredentialsInVaultBulk,
    reconcileCredentialsBulk
  ],
  triggers: []
});
