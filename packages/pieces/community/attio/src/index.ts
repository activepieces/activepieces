import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { createEntry } from './lib/actions/create-entry';
import { updateEntry } from './lib/actions/update-entry';
import { findRecord } from './lib/actions/find-record';
import { findListEntry } from './lib/actions/find-list-entry';

export const attioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  You can obtain API key from [API Section](https://attio.com/help/apps/other-apps/generating-an-api-key).`,
});

export const attio = createPiece({
  displayName: 'Attio',
  auth: attioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/attio.png',
  authors: [],
  actions: [createRecord, updateRecord, createEntry, updateEntry, findRecord, findListEntry],
  triggers: [],
});
