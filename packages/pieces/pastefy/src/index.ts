import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import actions from "./lib/actions";

export const pastefy = createPiece({
  name: "pastefy",
  displayName: "Pastefy",
  logoUrl: "https://cdn.activepieces.com/pieces/pastefy.png", // https://interaapps.de/img/pastefy.e1cdf365.png
  version: packageJson.version,
  authors: ['JanHolger'],
  actions,
  triggers: [],
});
