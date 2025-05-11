import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { findRecordAction } from './lib/actions/find-record';
import { createEntryAction } from './lib/actions/create-entry';
import { updateEntryAction } from './lib/actions/update-entry';
import { findListEntryAction } from './lib/actions/find-list-entry';

// Import triggers
import { recordCreatedTrigger } from './lib/triggers/record-created';
import { recordUpdatedTrigger } from './lib/triggers/record-updated';
import { listEntryCreatedTrigger } from './lib/triggers/list-entry-created';
import { listEntryUpdatedTrigger } from './lib/triggers/list-entry-updated';

const markdownDescription = `
To use Attio, you need to generate an API key:
1. Login to your Attio account at https://app.attio.com
2. Navigate to Settings > API
3. Create a new API key with the necessary permissions
4. Copy the generated API key

Your API key will be used with Bearer token authentication when making requests to the Attio API.
`;

export const attioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const attio = createPiece({
  displayName: "Attio",
  description: "Modern, collaborative CRM platform built to be fully customizable and real-time",
  auth: attioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/attio.png",
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["abuaboud"],
  actions: [
    createRecordAction,
    updateRecordAction,
    findRecordAction,
    createEntryAction,
    updateEntryAction,
    findListEntryAction
  ],
  triggers: [
    recordCreatedTrigger,
    recordUpdatedTrigger,
    listEntryCreatedTrigger,
    listEntryUpdatedTrigger
  ],
});
