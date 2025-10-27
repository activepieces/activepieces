import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { folkAuth } from "./lib/common/auth";
import { companyAdded } from "./lib/triggers/company-added";
import { companyRemoved } from "./lib/triggers/company-removed";
import { companyUpdated } from "./lib/triggers/company-updated";
import { companyCustomFieldUpdated } from "./lib/triggers/company-custom-field-updated";
import { personAdded } from "./lib/triggers/person-added";
import { personRemoved } from "./lib/triggers/person-removed";
import { personUpdated } from "./lib/triggers/person-updated";
import { personCustomFieldUpdated } from "./lib/triggers/person-custom-field-updated";
import { createCompany } from "./lib/actions/create-company";
import { updateCompany } from "./lib/actions/update-company";
import { getCompany } from "./lib/actions/get-a-company";
import { findCompanies } from "./lib/actions/find-a-company";
import { createPerson } from "./lib/actions/create-person";
import { updatePerson } from "./lib/actions/update-person";
import { getPerson } from "./lib/actions/get-a-person";
import { findPeople } from "./lib/actions/find-a-person";

export const folk = createPiece({
  displayName: "Folk",
  auth: folkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/folk.png",
  authors: [],
  actions: [
    createCompany,
    updateCompany,
    getCompany,
    findCompanies,
    createPerson,
    updatePerson,
    getPerson,
    findPeople,
  ],
  triggers: [
    companyAdded,
    companyRemoved,
    companyUpdated,
    companyCustomFieldUpdated,
    personAdded,
    personRemoved,
    personUpdated,
    personCustomFieldUpdated,
  ],
});
