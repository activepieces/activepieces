
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { mindeePredictDocumentAction } from "./lib/actions/predict-document";

export const mindee = createPiece({
  name: "mindee",
  displayName: "Mindee",
  logoUrl: "https://static.crozdesk.com/web_app_library/providers/logos/000/016/988/box/mindee-1669220105-logo.png?1669220105",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [mindeePredictDocumentAction],
  triggers: [],
});
