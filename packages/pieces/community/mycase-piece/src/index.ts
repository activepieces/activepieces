import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCase } from './lib/actions/create-case';
import { createCaseStage } from './lib/actions/create-case-stage';
import { createCompany } from './lib/actions/create-company';
import { createCustomField } from './lib/actions/create-custom-field';
import { createDocument } from './lib/actions/create-document';
import { createEvent } from './lib/actions/create-event';
import { createExpense } from './lib/actions/create-expense';
import { createLead } from './lib/actions/create-lead';
import { createLocation } from './lib/actions/create-location';
import { createNote } from './lib/actions/create-note';
import { createPerson } from './lib/actions/create-person';
import { createPracticeArea } from './lib/actions/create-practice-area';
import { createReferralSource } from './lib/actions/create-referral-source';
import { createTask } from './lib/actions/create-task';
import { createTimeEntry } from './lib/actions/create-time-entry';
import { createCall } from './lib/actions/create-call';
import { updateCase } from './lib/actions/update-case';
import { updateCompany } from './lib/actions/update-company';
import { updatePerson } from './lib/actions/update-person';
import { makeRequest } from './lib/actions/make-request';
import { findCase } from './lib/actions/find-case';
import { findCall } from './lib/actions/find-call';
import { findCaseStage } from './lib/actions/find-case-stage';
import { findCompany } from './lib/actions/find-company';
import { findLocation } from './lib/actions/find-location';
import { findPeopleGroup } from './lib/actions/find-people-group';
import { findPerson } from './lib/actions/find-person';
import { findPracticeArea } from './lib/actions/find-practice-area';
import { findReferralSource } from './lib/actions/find-referral-source';
import { findStaff } from './lib/actions/find-staff';
import { findOrCreateCase } from './lib/actions/find-or-create-case';
import { findOrCreateCaseStage } from './lib/actions/find-or-create-case-stage';
import { findOrCreateCompany } from './lib/actions/find-or-create-company';
import { findOrCreateLocation } from './lib/actions/find-or-create-location';
import { findOrCreatePerson } from './lib/actions/find-or-create-person';
import { findOrCreatePracticeArea } from './lib/actions/find-or-create-practice-area';
import { findOrCreateReferralSource } from './lib/actions/find-or-create-referral-source';

export const mycaseAuth = PieceAuth.OAuth2({
  description: 'MyCase OAuth 2.0 Authentication',
  authUrl: 'https://auth.mycase.com/login_sessions/new',
  tokenUrl: 'https://auth.mycase.com/tokens',
  required: true,
  scope: []
});

export const mycasePiece = createPiece({
  displayName: 'MyCase',
  auth: mycaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mycase-piece.png',
  authors: [],
  actions: [createCase, createCaseStage, createCompany, createCustomField, createDocument, createEvent, createExpense, createLead, createLocation, createNote, createPerson, createPracticeArea, createReferralSource, createTask, createTimeEntry, createCall, updateCase, updateCompany, updatePerson, makeRequest, findCase, findCall, findCaseStage, findCompany, findLocation, findPeopleGroup, findPerson, findPracticeArea, findReferralSource, findStaff, findOrCreateCase, findOrCreateCaseStage, findOrCreateCompany, findOrCreateLocation, findOrCreatePerson, findOrCreatePracticeArea, findOrCreateReferralSource],
  triggers: []
});
