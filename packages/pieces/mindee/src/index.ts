
import { createPiece } from "@activepieces/pieces-framework";
import { mindeePredictDocumentAction } from "./lib/actions/predict-document";

export const mindee = createPiece({
  displayName: "Mindee",
  logoUrl: "https://cdn.activepieces.com/pieces/mindee.png",
  authors: ['kanarelo'],
  actions: [mindeePredictDocumentAction],
  triggers: [],
});
