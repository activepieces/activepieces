
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
        description: 'Enter your Wufoo API Key. This key is required to authenticate API requests and access your Wufoo forms and entries. You can find your API Key by logging into your Wufoo account, selecting any form, clicking the "More" dropdown, and choosing "API Information". The API Key will be displayed at the top of the page.'
      }),
      authors: ['sparkybug'],
      actions: [createFormEntry, findForm, getEntryDetails, findSubmissionByFieldValue],
      triggers: [newFormEntry, newForm],
    });
    