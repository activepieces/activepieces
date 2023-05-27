
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

import { getCustomersAction } from "./lib/actions/get-customers";

export const clockodo = createPiece({
  name: "clockodo",
  displayName: "Clockodo",
  logoUrl: "https://cdn.activepieces.com/pieces/clockodo.png",
  version: packageJson.version,
  authors: [],
  actions: [
    getCustomersAction
  ],
  triggers: [],
});
