import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { wufooCreateFormEntry } from './lib/action/create-form-entry';
import { wufooFindForm } from './lib/action/find-form';
import { wufooGetEntryDetails } from './lib/action/get-entry-details';
import { wufooFindSubmissionByField } from './lib/action/find-submission-by-field';
import { wufooNewFormEntry } from './lib/trigger/new-form-entry';
import { wufooNewForm } from './lib/trigger/new-form';

export const wufooAuth = PieceAuth.Custom({
  description: 'Authenticate with your Wufoo API Key and subdomain.',
  required: true,
  props: {
    subdomain: {
      displayName: 'Subdomain',
      description: 'Your Wufoo account subdomain (e.g., fishbowl for https://fishbowl.wufoo.com).',
      required: true,
      type: 'SHORT_TEXT',
    },
    apiKey: {
      displayName: 'API Key',
      description: 'Your Wufoo API Key.',
      required: true,
      type: 'SHORT_TEXT',
    },
  },
});

export const wufoo = createPiece({
  displayName: 'Wufoo',
  description: 'Online form builder for surveys, invitations, and more.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://wufoo.com/images/logo.png',
  auth: wufooAuth,
  categories: [PieceCategory.FORMS],
  actions: [
    wufooCreateFormEntry,
    wufooFindForm,
    wufooGetEntryDetails,
    wufooFindSubmissionByField,
  ],
  authors: ['your-github-username'],
  triggers: [
    wufooNewFormEntry,
    wufooNewForm,
  ],
}); 