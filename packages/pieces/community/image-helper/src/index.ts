import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { imageToBase64 } from './lib/actions/image-to-base64.action';
import { getMetaData } from './lib/actions/get-metadata.action';
import { cropImage } from './lib/actions/crop-image.action';
import { rotateImage } from './lib/actions/rotate-image.action';
import { resizeImage } from './lib/actions/resize-Image.action';
import { compressImage } from './lib/actions/compress-image.actions';

export const imageHelper = createPiece({
  displayName: 'Image Helper',
  description: 'Tools for image manipulations',

  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/image-helper.png',
  authors: ["AbdullahBitar","kishanprmr","abuaboud"],
  categories: [PieceCategory.CORE],
  actions: [imageToBase64, getMetaData, cropImage, rotateImage, resizeImage, compressImage],
  triggers: [],
});
