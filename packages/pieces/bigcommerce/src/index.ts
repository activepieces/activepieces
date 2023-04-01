
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { bigcommerceTriggers } from "./lib/triggers";

export const bigcommerce = createPiece({
  name: "bigcommerce",
  displayName: "Bigcommerce",
  logoUrl: "https://www-cdn.bigcommerce.com/assets/bc-photo-branding-bigcommerce-primary-gray-background.png",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [],
  triggers: bigcommerceTriggers,
});
