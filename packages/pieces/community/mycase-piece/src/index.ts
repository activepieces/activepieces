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
import { caseAddedOrUpdated } from './lib/triggers/case-added-or-updated';
import { eventAddedOrUpdated } from './lib/triggers/event-added-or-updated';
import { personAddedOrUpdated } from './lib/triggers/person-added-or-updated';
import { companyAddedOrUpdated } from './lib/triggers/company-added-or-updated';
import { leadAddedOrUpdated } from './lib/triggers/lead-added-or-updated';

const mycaseAuthDescription = `
## MyCase OAuth 2.0 Setup

### Obtaining Client Credentials
1. Contact MyCase support at [https://www.mycase.com/support/](https://www.mycase.com/support/) to request OAuth 2.0 client credentials
2. Provide your application details and request a client ID and client secret
3. MyCase support will provide you with:
   - **Client ID**: Your OAuth Client ID
   - **Client Secret**: Your OAuth Client secret
   - **Redirect URI**: A pre-configured redirect URI for your application

### Required Permissions
The authorizing user must have the **"Manage your firm's preferences, billing, and payment options"** permission set to **Yes** in MyCase.

### Authorization Flow
MyCase uses OAuth 2.0 Authorization Code Grant flow with the following endpoints:

**Authorization URL**: \`https://auth.mycase.com/login_sessions/new\`  
**Token URL**: \`https://auth.mycase.com/tokens\`

### Rate Limits
- 25 requests per second per client
- Access tokens are valid for 24 hours
- Refresh tokens are valid for 2 weeks

For detailed API documentation, visit: [https://mycaseapi.stoplight.io/docs/mycase-api-documentation/k5xpc4jyhkom7-getting-started](https://mycaseapi.stoplight.io/docs/mycase-api-documentation/k5xpc4jyhkom7-getting-started)
`;

export const mycaseAuth = PieceAuth.OAuth2({
  description: mycaseAuthDescription,
  authUrl: 'https://auth.mycase.com/login_sessions/new',
  tokenUrl: 'https://auth.mycase.com/tokens',
  required: true,
  scope: [],
  pkce: true
});

export const mycasePiece = createPiece({
  displayName: 'MyCase',
  description: 'Automate legal case management workflows with MyCase. Create and manage cases, clients, companies, events, tasks, time entries, documents, and more. Get notified when cases, events, people, companies, or leads are added or updated.',
  auth: mycaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mycase-piece.png',
  authors: ["Fortunamide"],
  actions: [createCase, createCaseStage, createCompany, createCustomField, createDocument, createEvent, createExpense, createLead, createLocation, createNote, createPerson, createPracticeArea, createReferralSource, createTask, createTimeEntry, createCall, updateCase, updateCompany, updatePerson, makeRequest, findCase, findCall, findCaseStage, findCompany, findLocation, findPeopleGroup, findPerson, findPracticeArea, findReferralSource, findStaff, findOrCreateCase, findOrCreateCaseStage, findOrCreateCompany, findOrCreateLocation, findOrCreatePerson, findOrCreatePracticeArea, findOrCreateReferralSource],
  triggers: [caseAddedOrUpdated, eventAddedOrUpdated, personAddedOrUpdated, companyAddedOrUpdated, leadAddedOrUpdated]
});
