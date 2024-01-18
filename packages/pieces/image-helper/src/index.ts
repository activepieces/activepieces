
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { imageToBase64 } from "./lib/actions/image-to-base64.action";
//import { resizeImage } from "./lib/actions/resize-image.action";
//import { flipImage } from "./lib/actions/flip-image.action";

export const imageHelper = createPiece({
  displayName: "Image-helper",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/image-helper.png",
  authors: ["PFernandez98"],
  //actions: [imageToBase64, resizeImage, flipImage],
  actions: [imageToBase64],
  triggers: [],
});
