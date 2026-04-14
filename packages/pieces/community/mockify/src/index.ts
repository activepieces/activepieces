import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { mockApiAction } from "./lib/actions/mock-api";
import { mockWebhookTrigger } from "./lib/triggers/mock-webhook";
import { newRequestLogTrigger } from "./lib/triggers/new-request-log";

export const mockify = createPiece({
  name: "mockify",
  displayName: "Mockify",
  description: "Create dynamic mock API endpoints and simulate backend responses.",
  logoUrl: "https://cdn.activepieces.com/pieces/mockify.png",
  authors: ["Abanoub Gerges Azer"],
  auth: undefined,
  minimumSupportedRelease: "0.30.0",
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [mockApiAction],
  triggers: [mockWebhookTrigger, newRequestLogTrigger],
});
