
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { bigcommerceTriggers } from "./lib/triggers";

export const bigcommerce = createPiece({
  name: "bigcommerce",
  displayName: "Bigcommerce",
  logoUrl: "https://www.code-mage.com/media/06/72/22/1595065961/bigcommerce-platform-logo.svg",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [],
  triggers: bigcommerceTriggers,
});
