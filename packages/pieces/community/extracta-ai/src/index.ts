
    import { createPiece } from "@activepieces/pieces-framework";
    import { extractaAiAuth } from "./lib/common";
    import { extractFileData } from "./lib/actions/extract-file-data";
    import { uploadFile } from "./lib/actions/upload-file";
    import { getExtractionResults } from "./lib/actions/get-extraction-results";
    import { newDocumentProcessed } from "./lib/triggers/new-document-processed";
    import { extractionFailed } from "./lib/triggers/extraction-failed";

    export const extractaAi = createPiece({
      displayName: "Extracta-ai",
      auth: extractaAiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/extracta-ai.png",
      authors: [],
      actions: [extractFileData, uploadFile, getExtractionResults],
      triggers: [newDocumentProcessed, extractionFailed],
    });
    