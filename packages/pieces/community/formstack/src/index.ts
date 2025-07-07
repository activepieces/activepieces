
import { createPiece } from "@activepieces/pieces-framework";
import { getForm } from "./lib/actions/get-form";
import { formStackAuth } from "./lib/common/auth";

export const formstack = createPiece({
  displayName: "Formstack",
  auth: formStackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/formstack.png",
  authors: ['Sanket6652'],
  actions: [getForm],
  triggers: [],
});
