
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { mindeePredictDocumentAction } from "./lib/actions/predict-document";

export const mindee = createPiece({
  name: "mindee",
  displayName: "Mindee",
  logoUrl: "https://cdn.activepieces.com/pieces/mindee.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ['kanarelo'],
  actions: [mindeePredictDocumentAction],
  triggers: [],
});
