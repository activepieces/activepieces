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

export const folk = createPiece({
  displayName: "Folk",
  auth: folkAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/folk.png",
  authors: [],
  actions: [],
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
