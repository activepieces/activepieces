
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { boxTriggers } from "./lib/triggers";

export const box = createPiece({
  name: "box",
  displayName: "Box",
  logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/57/Box%2C_Inc._logo.svg",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: boxTriggers,
});
