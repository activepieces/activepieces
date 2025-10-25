
    import { createPiece } from "@activepieces/pieces-framework";
    import { extractaAiAuth } from "./lib/common";
    import { extractFileData } from "./lib/actions/extract-file-data";
    import { uploadFile } from "./lib/actions/upload-file";
    import { getExtractionResults } from "./lib/actions/get-extraction-results";
    import { newDocumentProcessed } from "./lib/triggers/new-document-processed";
    import { extractionFailed } from "./lib/triggers/extraction-failed";
    import { PieceCategory } from "@activepieces/shared";


    export const extractaAi = createPiece({
      displayName: "Extracta.ai",
      description: "An AI document extraction & content analysis platform that transforms unstructured files (PDFs, images, URLs, etc.) into structured data.",
      auth: extractaAiAuth,
      minimumSupportedRelease: '0.36.1',
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
      logoUrl: "https://cdn.activepieces.com/pieces/extracta-ai.png",
      authors: ['fortunamide', 'onyedikachi-david'],
      actions: [extractFileData, uploadFile, getExtractionResults],
      triggers: [newDocumentProcessed, extractionFailed],
    });
    