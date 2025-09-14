
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { editPresentation } from "./lib/actions/edit-presentation";
import { generatePresentation } from "./lib/actions/generate-presentation";
import { getTaskStatus } from "./lib/actions/get-task-status";
import { uploadDocument } from "./lib/actions/upload-document";
import { newPresentation } from "./lib/triggers/new-presentation";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { SlideSpeakAuth } from "./lib/common/auth";
import { BASE_URL } from "./lib/common/client";

export const slidespeak = createPiece({
  displayName: "Slidespeak",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/slidespeak.png",
  authors: ['Niket2035'],
  actions: [
    editPresentation,
    generatePresentation,
    getTaskStatus,
    uploadDocument,
    createCustomApiCallAction({
      auth: SlideSpeakAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'X-API-Key': auth as string,
        };
      },
    }),
  ],
  triggers: [
    newPresentation
  ],
});
