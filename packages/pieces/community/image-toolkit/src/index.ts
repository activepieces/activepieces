import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { resizeImage } from "./lib/actions/resize.action";
import { cropImage } from "./lib/actions/crop.action";
import { convertImage } from "./lib/actions/convert.action";
import { compressImage } from "./lib/actions/compress.action";
import { extractMetadata } from "./lib/actions/extract-metadata.action";
import { removeMetadata } from "./lib/actions/remove-metadata.action";

export const imageToolkit = createPiece({
  displayName: "Image Toolkit",
  description: "Image processing toolkit: resize, crop, convert, compress, and metadata tools.",
  auth: PieceAuth.None(),

  minimumSupportedRelease: "0.0.0",

  categories: [PieceCategory.CONTENT_AND_FILES],

  logoUrl: "https://cdn.activepieces.com/pieces/image-toolkit.png",

  authors: ["@lau90eth"],

  actions: [
    resizeImage,
    cropImage,
    convertImage,
    compressImage,
    extractMetadata,
    removeMetadata,
  ],

  triggers: [],
});
