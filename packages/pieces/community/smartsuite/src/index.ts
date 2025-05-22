import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { uploadFileAction } from './lib/actions/upload-file';
import { findRecordsAction } from './lib/actions/find-records';
import { getRecordAction } from './lib/actions/get-record';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';

const markdownDescription = `
To use SmartSuite, you need to get an API key:
1. Login to your SmartSuite account
2. Navigate to Account Settings > API Keys
3. Create a new API key and copy it

You also need your workspace ID:
1. This can be found in your SmartSuite account settings
2. Or in the URL when you're logged in (e.g., https://app.smartsuite.com/YOUR_WORKSPACE_ID/home)

For webhook triggers (New Record and Updated Record), you'll need to manually set up webhooks in your SmartSuite account following the instructions provided within each trigger.
`;

export const smartsuiteAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your SmartSuite API key',
      required: true,
    }),
    workspaceId: PieceAuth.SecretText({
      displayName: 'Workspace ID',
      description: 'Your SmartSuite workspace ID',
      required: true,
    }),
  },
  required: true,
});

export const smartsuite = createPiece({
  displayName: 'SmartSuite',
  description: 'Collaborative work management platform that combines databases with spreadsheets',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartsuite.png',
  minimumSupportedRelease: '0.36.1',
  authors: ['ankitsharmaongithub'],
  auth: smartsuiteAuth,
  actions: [
    createRecordAction,
    updateRecordAction,
    uploadFileAction,
    findRecordsAction,
    getRecordAction
  ],
  triggers: [
    newRecordTrigger,
    updatedRecordTrigger
  ],
  categories: [PieceCategory.PRODUCTIVITY],
});
