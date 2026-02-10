import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
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

export const quickbaseAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    realmHostname: Property.ShortText({
      displayName: 'Realm Hostname',
      description: 'Enter your Quickbase Realm Hostname (e.g., yourrealm.quickbase.com)',
      required: true,
    }),
    userToken: Property.ShortText({
      displayName: 'User Token',
      description: 'Enter your Quickbase User Token',
      required: true,
    }),
  },
});

export const quickbase = createPiece({
  displayName: 'Quickbase',
  auth: quickbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbase.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sparkybug','sanket-a11y'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    findRecord,
    findOrCreateRecord,
    createUpdateRecordsBulk,
    createCustomApiCallAction({
      auth: quickbaseAuth,
      baseUrl: (auth) => {
        return `https://api.quickbase.com/v1`;
      },
      authMapping: async (auth) => {
        return {
          'QB-Realm-Hostname': (auth).props.realmHostname,
          'Authorization': `QB-USER-TOKEN ${(auth).props.userToken}`,
          'Content-Type': 'application/json',
        };
      },
    })
  ],
  triggers: [newRecord, newOrUpdatedRecord],
});
