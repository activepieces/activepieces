import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { parserExpertAuth } from "./lib/common/auth";
import { uploadDocument } from "./lib/actions/upload-document";
import { getExtractedData } from "./lib/actions/get-extracted-data";

export const parserExpert = createPiece({
  displayName: "Parser Expert",
  auth: parserExpertAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/parser-expert.png",
  description: "Parse documents and extract data from PDFs, DOCX files, images, and webpages using Parser Expert's powerful API.",
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["onyedikachi-david"],
  actions: [
    uploadDocument,
    getExtractedData,
  ],
  triggers: [],
});
