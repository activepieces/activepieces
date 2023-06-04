
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import actions from "./lib/actions";

export const pastebin = createPiece({
  name: "pastebin",
  displayName: "Pastebin",
  logoUrl: "https://cdn.activepieces.com/pieces/pastebin.png",
  version: packageJson.version,
  authors: ['JanHolger'],
  actions,
  triggers: [],
});
