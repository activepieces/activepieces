import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { addRecord } from './lib/actions/add-record';
import { deleteRecord } from './lib/actions/delete-record';
import { getRecord } from './lib/actions/get-record';
import { mobileDeviceAction } from './lib/actions/mobile-device-action';
import { searchRecords } from './lib/actions/search-records';
import { suspendUser } from './lib/actions/suspend-user';
import { transferData } from './lib/actions/transfer-data';
import { updateRecord } from './lib/actions/update-record';
import { googleWorkspaceAuth } from './lib/auth';
import { DATA_TRANSFER_PATH, DIRECTORY_PATH, GOOGLE_ADMIN_API_ROOT, REPORTS_PATH } from './lib/common/client';
import { resolveAuth } from './lib/common/token';
import { newAdminActivityEvent } from './lib/triggers/new-admin-activity-event';
import { newApplicationActivityEvent } from './lib/triggers/new-application-activity-event';
import { newUserEvent } from './lib/triggers/new-user-event';

export const googleWorkspace = createPiece({
  displayName: 'Google Workspace',
  description: 'Manage Google Workspace users, groups, organizational units and devices, and react to Admin audit events.',
  auth: googleWorkspaceAuth,
  minimumSupportedRelease: '0.88.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-workspace.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['fabio-kozlowski'],
  actions: [
    addRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    searchRecords,
    suspendUser,
    mobileDeviceAction,
    transferData,
    createCustomApiCallAction({
      auth: googleWorkspaceAuth,
      baseUrl: () => GOOGLE_ADMIN_API_ROOT,
      description: `Call any Admin SDK endpoint. Paths are relative to ${GOOGLE_ADMIN_API_ROOT}, e.g. /${DIRECTORY_PATH}/users?customer=my_customer, /${REPORTS_PATH}/activity/users/all/applications/login, /${DATA_TRANSFER_PATH}/applications.`,
      authMapping: async (auth) => {
        const { access_token } = await resolveAuth(auth);
        return { Authorization: `Bearer ${access_token}` };
      },
    }),
  ],
  triggers: [newAdminActivityEvent, newApplicationActivityEvent, newUserEvent],
});
