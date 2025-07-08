
    import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
    import { createFormEntry } from './lib/action/create-form-entry';
    import { findForm } from './lib/action/find-form';
    import { getEntryDetails } from './lib/action/get-entry-details';
    import { findSubmissionByFieldValue } from './lib/action/find-submission-by-field-value';
    import { newFormEntry } from './lib/trigger/new-form-entry';
    import { newForm } from './lib/trigger/new-form';

    export const wufoo = createPiece({
      displayName: 'Wufoo',
      logoUrl: 'https://www.wufoo.com/images/logo.png',
      auth: PieceAuth.SecretText({
        displayName: 'API Key',
        required: true,
        description: 'Your Wufoo API Key. Find it in your Wufoo account under API Information.'
      }),
      authors: ['your-github-username'],
      actions: [createFormEntry, findForm, getEntryDetails, findSubmissionByFieldValue],
      triggers: [newFormEntry, newForm],
    });
    