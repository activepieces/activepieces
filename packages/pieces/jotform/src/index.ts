
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

export const jotform = createPiece({
  name: "jotform",
  displayName: "Jotform",
  logoUrl: "https://www.jotform.com/resources/assets/icon/min/jotform-icon-white-400x400.png",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [],
  triggers: [],
});
