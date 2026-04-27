import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { generateFakeData } from "./lib/actions/generate-data";
import { newFakeDataTrigger } from "./lib/triggers/new-fake-data";

export const fakely = createPiece({
  displayName: "Fakely",
  description: "Generate fake/dummy data for testing and simulation.",
  logoUrl: "https://cdn.activepieces.com/pieces/fakely.png",
  authors: ["Abanoub Gerges Azer"],
  auth: undefined,
  minimumSupportedRelease: "0.30.0",
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [generateFakeData],
  triggers: [newFakeDataTrigger],
});
