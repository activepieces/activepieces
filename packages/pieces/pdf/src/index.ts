
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { pdfDataSource } from "./lib/sources/pdf-datasource";

export const pdf = createPiece({
  displayName: "PDF",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.6.0',
  logoUrl: "https://cdn.activepieces.com/pieces/pdf.png",
  authors: [],
  actions: [],
  triggers: [],
  datasources: [pdfDataSource],
});
