
import { createPiece } from "@activepieces/pieces-framework";
import { myCaseAuth } from "./lib/common/auth";
import { caseAddedOrUpdated } from "./lib/triggers/case-added-or-updated";
import { companyAddedOrUpdated } from "./lib/triggers/company-added-or-updated";
import { eventAddedOrUpdated } from "./lib/triggers/event-added-or-updated";
import { leadAddedOrUpdated } from "./lib/triggers/lead-added-or-updated";
import { personAddedOrUpdated } from "./lib/triggers/person-added-or-updated";
import { createCase } from "./lib/actions/create-case";
import { createCaseStage } from "./lib/actions/create-case-stage";
import { createCompany } from "./lib/actions/create-company";
import { createCustomField } from "./lib/actions/create-custom-field";
import { createDocument } from "./lib/actions/create-document";
import { createEvent } from "./lib/actions/create-event";
import { createExpense } from "./lib/actions/create-expense";
import { createLocation } from "./lib/actions/create-location";
import { createNote } from "./lib/actions/create-note";
import { createPerson } from "./lib/actions/create-person";
import { createPracticeArea } from "./lib/actions/create-practice-area";
import { createReferralSource } from './lib/actions/create-refferal-source';
import { createTask } from "./lib/actions/create-task";
import { createTimeEntry } from "./lib/actions/create-time-entry";
import { createCall } from "./lib/actions/create-call";
import { updateCase } from "./lib/actions/update-case";
import { updateCompany } from "./lib/actions/update-company";
import { updatePerson } from "./lib/actions/update-person";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { myCaseBaseUrl } from "./lib/common/constants";
import { findCase } from "./lib/actions/find-case";
import { findCaller } from "./lib/actions/find-caller";
import { findCaseStage } from "./lib/actions/find-case-stage";
import { findCompanyContact } from "./lib/actions/find-company-contact";
import { findLocation } from "./lib/actions/find-location";
import { findPeopleGroup } from "./lib/actions/find-people-group";
import { findPersonContact } from "./lib/actions/find-person-contact";
import { findPracticeArea } from "./lib/actions/find-practice-area";
import { findStaff } from "./lib/actions/find-staff";
import { findOrCreateCase } from "./lib/actions/find-or-create-case";
import { findOrCreateCaseStage } from "./lib/actions/find-or-create-case-stage";
import { findOrCreateCompany } from "./lib/actions/find-or-create-company";
import { findOrCreateLocation } from "./lib/actions/find-or-create-location";
import { findOrCreatePerson } from "./lib/actions/find-or-create-person";
import { findOrCreatePracticeArea } from "./lib/actions/find-or-create-practice-area";
import { findOrCreateReferralSource } from "./lib/actions/find-or-create-referral-source";

export const mycase = createPiece({
  displayName: 'Mycase',
  auth: myCaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mycase.png',
  authors: ['gs03-dev'],
  actions: [
    createCase,
    createCaseStage,
    createCompany,
    createCustomField,
    createDocument,
    createEvent,
    createExpense,
    createLocation,
    createNote,
    createPerson,
    createPracticeArea,
    createReferralSource,
    createTask,
    createTimeEntry,
    createCall,
    updateCase,
    updateCompany,
    updatePerson,
    findCase,
    findCaller,
    findCaseStage,
    findCompanyContact,
    findLocation,
    findPeopleGroup,
    findPersonContact,
    findPracticeArea,
    findStaff,
    findOrCreateCase,
    findOrCreateCaseStage,
    findOrCreateCompany,
    findOrCreateLocation,
    findOrCreatePerson,
    findOrCreatePracticeArea,
    findOrCreateReferralSource,
    createCustomApiCallAction({
      auth: myCaseAuth,
      baseUrl: () => myCaseBaseUrl,
      authMapping: async (auth: any) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
        };
      },
    }),
  ],
  triggers: [
    caseAddedOrUpdated,
    companyAddedOrUpdated,
    eventAddedOrUpdated,
    leadAddedOrUpdated,
    personAddedOrUpdated,
  ],
});