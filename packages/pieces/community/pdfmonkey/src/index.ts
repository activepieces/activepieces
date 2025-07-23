
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { pdfmonkeyAuth } from "./lib/common/auth";
import { generateDocument } from "./lib/actions/generate-document";
import { deleteDocument } from "./lib/actions/delete-document";
import { findDocument } from "./lib/actions/find-document";
import { documentGenerated } from "./lib/triggers/document-generated";

export const pdfmonkey = createPiece({
  displayName: "Pdfmonkey",
  auth: pdfmonkeyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/pdfmonkey.png",
  authors: ['Sanket6652'],
  actions: [
    generateDocument,
    deleteDocument,
    findDocument
  ],
  triggers: [documentGenerated],
});
