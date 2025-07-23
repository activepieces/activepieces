import { createPiece } from "@activepieces/pieces-framework";
import { pdfmonkeyAuth } from "./lib/auth";

// Actions
import { findDocument } from './lib/actions/find-document';
import { generateDocument } from './lib/actions/generate-document';
import { deleteDocument } from './lib/actions/delete-document';

// Triggers
import { documentGenerated } from './lib/triggers/document-generated';

export const pdfmonkey = createPiece({
  displayName: "PDFMonkey",
  description: 'PDFMonkey is a document automation service that generates PDFs from templates and structured data',
  auth: pdfmonkeyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/pdfmonkey.png",
  authors: ['stefansarya'],
  actions: [findDocument, generateDocument, deleteDocument],
  triggers: [documentGenerated],
});