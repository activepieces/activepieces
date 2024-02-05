import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { imageToBase64 } from './lib/actions/image-to-base64.action';
import { getMetaData } from './lib/actions/get-metadata.action';
import { cropImage } from './lib/actions/crop-image.action';
import { rotateImage } from './lib/actions/rotate-image.action';
import { resizeImage } from './lib/actions/resize-Image.action';

export const imageHelper = createPiece({
  displayName: 'Image Helper',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/image-helper.png',
  authors: ['PFernandez98', 'AbdullahBitar'],
  categories: [PieceCategory.CORE],
  actions: [imageToBase64, getMetaData, cropImage, rotateImage, resizeImage],
  triggers: [],
});
