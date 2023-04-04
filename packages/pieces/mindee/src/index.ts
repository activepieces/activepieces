
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { mindeePredictDocumentAction } from "./lib/actions/predict-document";

export const mindee = createPiece({
  name: "mindee",
  displayName: "Mindee",
  logoUrl: "https://cdn.activepieces.com/pieces/mindee.png",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [mindeePredictDocumentAction],
  triggers: [],
});
