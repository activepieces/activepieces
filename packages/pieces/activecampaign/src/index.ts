
import { createPiece } from "@activepieces/framework"
import { activeCampaignTriggers } from "./lib/triggers"

import packageJson from "../package.json"
import { activeCampaignCreateContact } from "./lib/triggers/actions/create-contact";

export const activecampaign = createPiece({
  name: "activecampaign",
  displayName: "ActiveCampaign",
  logoUrl: "https://www.activecampaign.com/themes/v2/images/favicons/favicon.svg",
  version: packageJson.version,
  authors: [],
  actions: [activeCampaignCreateContact],
  triggers: activeCampaignTriggers,
});
