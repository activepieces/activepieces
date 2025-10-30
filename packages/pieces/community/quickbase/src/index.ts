import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { findRecord } from './lib/actions/find-record';
import { findOrCreateRecord } from './lib/actions/find-or-create-record';
import { createUpdateRecordsBulk } from './lib/actions/create-update-records-bulk';
import { newRecord } from './lib/triggers/new-record';
import { newOrUpdatedRecord } from './lib/triggers/new-or-updated-record';

const markdown = `
## Quickbase Authentication Setup

### 1. Get Your User Token
- Log in to your Quickbase account
- Go to **My Preferences** → **My User Information**
- Click on **Manage User Tokens**
- Click **New User Token**
- Enter a name for your token and click **Create**
- Copy the generated token (it will only be shown once)

### 2. Required Permissions
Your user token needs access to:
- Read/write permissions for the apps and tables you want to use
- Admin permissions for creating/deleting records (if needed)

**Security Note:** Keep your user token secure - it provides access to your Quickbase data.
`;

export const quickbaseAuth = PieceAuth.SecretText({
  displayName: 'User Token',
  description: markdown,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.quickbase.com/v1/apps',
        headers: {
          'QB-USER-TOKEN': auth,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return { valid: true };
      }

      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid user token. Please check your token and try again.',
        };
      }

      if (response.status === 403) {
        return {
          valid: false,
          error: 'Access denied. Please ensure your user token has the required permissions.',
        };
      }

      return {
        valid: false,
        error: `HTTP ${response.status}. Please verify your user token.`,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to validate token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

export const quickbase = createPiece({
  displayName: 'Quickbase',
  auth: quickbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbase.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sparkybug'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    findRecord,
    findOrCreateRecord,
    createUpdateRecordsBulk,
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
