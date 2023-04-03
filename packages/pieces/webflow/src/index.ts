
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

import { webflowTriggers } from "./lib/triggers";

export const webflow = createPiece({
  name: "webflow",
  displayName: "Webflow",
  logoUrl: "https://www.vectorlogo.zone/logos/webflow/webflow-icon.svg",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: webflowTriggers,
});
