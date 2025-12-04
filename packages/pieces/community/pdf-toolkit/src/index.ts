import { createPiece, PieceAuth, PieceCategory } from "@activepieces/pieces-framework";

import { mergePdf } from "./lib/actions/merge-pdf";
import { splitPdf } from "./lib/actions/split-pdf";
import { extractText } from "./lib/actions/extract-text";
import { extractPages } from "./lib/actions/extract-pages";
import { compressPdf } from "./lib/actions/compress-pdf";
import { addWatermark } from "./lib/actions/add-watermark";

export const pdfToolkit = createPiece({
  displayName: "PDF Toolkit",
  description: "Manipulate PDF files: merge, split, extract text/pages, compress, and apply watermarks.",
  logoUrl: "https://cdn.activepieces.com/pieces/pdf.png",
  authors: ["lau90eth"],
  auth: PieceAuth.None(),
  categories: [PieceCategory.CONTENT_AND_FILES],

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
