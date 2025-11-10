import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Triggers
import { newOrUpdatedLeadTrigger } from './lib/triggers/new-or-updated-lead';

// Actions
import { createCaseAction } from './lib/actions/create-case';
import { createCaseStageAction } from './lib/actions/create-case-stage';
import { createCompanyAction } from './lib/actions/create-company';
import { createCustomFieldAction } from './lib/actions/create-custom-field';
import { createDocumentAction } from './lib/actions/create-document';
import { createEventAction } from './lib/actions/create-event';
import { createExpenseAction } from './lib/actions/create-expense';
import { createLeadAction } from './lib/actions/create-lead';
import { createLocationAction } from './lib/actions/create-location';
import { createNoteAction } from './lib/actions/create-note';
import { createPersonAction } from './lib/actions/create-person';
import { createPracticeAreaAction } from './lib/actions/create-practice-area';
import { createReferralSourceAction } from './lib/actions/create-referral-source';
import { createTaskAction } from './lib/actions/create-task';
import { createTimeEntryAction } from './lib/actions/create-time-entry';
import { createCallAction } from './lib/actions/create-call';
import { updateCaseAction } from './lib/actions/update-case';
import { updateCompanyAction } from './lib/actions/update-company';
import { updatePersonAction } from './lib/actions/update-person';

// Search Actions
import { findCaseAction } from './lib/actions/find-case';
import { findCallerAction } from './lib/actions/find-caller';
import { findCaseStageAction } from './lib/actions/find-case-stage';
import { findCompanyContactAction } from './lib/actions/find-company-contact';
import { findLocationAction } from './lib/actions/find-location';
import { findPeopleGroupAction } from './lib/actions/find-people-group';
import { findPersonContactAction } from './lib/actions/find-person-contact';
import { findPracticeAreaAction } from './lib/actions/find-practice-area';
import { findReferralSourceAction } from './lib/actions/find-referral-source';
import { findStaffAction } from './lib/actions/find-staff';

// Find or Create Actions
import { findOrCreateCaseAction } from './lib/actions/find-or-create-case';
import { findOrCreateCaseStageAction } from './lib/actions/find-or-create-case-stage';
import { findOrCreateCompanyAction } from './lib/actions/find-or-create-company';
import { findOrCreateLocationAction } from './lib/actions/find-or-create-location';
import { findOrCreatePersonAction } from './lib/actions/find-or-create-person';
import { findOrCreatePracticeAreaAction } from './lib/actions/find-or-create-practice-area';
import { findOrCreateReferralSourceAction } from './lib/actions/find-or-create-referral-source';

const markdown = `
To obtain your MyCase API credentials:

1. Log in to your MyCase account
2. Navigate to Settings > API Settings
3. Generate a new API key
4. Copy the Client ID and Client Secret

For more information, visit: https://www.mycase.com/
`;

export const mycaseAuth = PieceAuth.OAuth2({
  description: markdown,
  authUrl: 'https://api.mycase.com/oauth2/authorize',
  tokenUrl: 'https://api.mycase.com/oauth2/token',
  required: true,
  scope: [],
});

export const mycase = createPiece({
  displayName: 'MyCase',
  description: 'Legal practice management software',
  auth: mycaseAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mycase.png',
  authors: [],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    // Create Actions
    createCaseAction,
    createCaseStageAction,
    createCompanyAction,
    createCustomFieldAction,
    createDocumentAction,
    createEventAction,
    createExpenseAction,
    createLeadAction,
    createLocationAction,
    createNoteAction,
    createPersonAction,
    createPracticeAreaAction,
    createReferralSourceAction,
    createTaskAction,
    createTimeEntryAction,
    createCallAction,
    
    // Update Actions
    updateCaseAction,
    updateCompanyAction,
    updatePersonAction,
    
    // Find Actions
    findCaseAction,
    findCallerAction,
    findCaseStageAction,
    findCompanyContactAction,
    findLocationAction,
    findPeopleGroupAction,
    findPersonContactAction,
    findPracticeAreaAction,
    findReferralSourceAction,
    findStaffAction,
    
    // Find or Create Actions
    findOrCreateCaseAction,
    findOrCreateCaseStageAction,
    findOrCreateCompanyAction,
    findOrCreateLocationAction,
    findOrCreatePersonAction,
    findOrCreatePracticeAreaAction,
    findOrCreateReferralSourceAction,
    
    // API Request Action
    createCustomApiCallAction({
      baseUrl: () => 'https://api.mycase.com/v1',
      auth: mycaseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    newOrUpdatedLeadTrigger,
  ],
});

