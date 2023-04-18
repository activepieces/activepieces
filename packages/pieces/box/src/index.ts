
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { boxTriggers } from "./lib/triggers";

export const box = createPiece({
  name: "box",
  displayName: "Box",
  logoUrl: "https://cdn.activepieces.com/pieces/box.png",
  version: packageJson.version,
  authors: ["mukewa"],
  actions: [],
  triggers: boxTriggers,
});
