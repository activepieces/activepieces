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

export const cyberarkAuth = PieceAuth.CustomAuth({
  description: 'CyberArk PVWA Authentication',
  props: {
    serverUrl: Property.ShortText({
      displayName: 'PVWA Server URL',
      description: 'The PVWA server URL (e.g., https://pvwa-server)',
      required: true
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'CyberArk username',
      required: true
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'CyberArk password',
      required: true
    })
  },
  required: true
});

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
    removeMemberFromGroup
  ],
  triggers: []
});
