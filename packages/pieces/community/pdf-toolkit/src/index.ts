import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { mergePdf } from "./lib/actions/merge-pdf";
import { splitPdf } from "./lib/actions/split-pdf";
import { extractText } from "./lib/actions/extract-text";
import { extractPages } from "./lib/actions/extract-pages";
import { compressPdf } from "./lib/actions/compress-pdf";
import { addWatermark } from "./lib/actions/add-watermark";

export const pdfToolkit = createPiece({
  displayName: "PDF Toolkit",
  description: "Utilities for manipulating PDF files: merge, split, extract, compress, watermark.",
  logoUrl: "https://cdn.activepieces.com/pieces/pdf.png",
  authors: ["lau90eth"],
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: undefined,
  actions: [
    mergePdf,
    splitPdf,
    extractText,
    extractPages,
    compressPdf,
    addWatermark,
  ],
  triggers: [],
});
