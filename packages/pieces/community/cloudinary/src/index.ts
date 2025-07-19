import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { uploadResource } from './lib/actions/upload-resource';
import { deleteResource } from './lib/actions/delete-resource';
import { transformResource } from './lib/actions/transform-resource';
import { findResourceByPublicId } from './lib/actions/find-resource-by-public-id';
import { createUsageReport } from './lib/actions/create-usage-report';
import { newResource } from './lib/triggers/new-resource';
import { newTagAddedToAsset } from './lib/triggers/new-tag-added-to-asset';

export const cloudinaryAuth = PieceAuth.BasicAuth({
  required: true,
  username: {
    displayName: 'API Key',
    description: 'Your Cloudinary API Key.'
  },
  password: {
    displayName: 'API Secret',
    description: 'Your Cloudinary API Secret.'
  }
});

export const cloudinary = createPiece({
  displayName: 'Cloudinary',
  logoUrl: 'https://res.cloudinary.com/cloudinary-marketing/image/upload/v1645023462/website/2021/logo/Cloudinary_Logo_Blue_Stacked.png',
  auth: cloudinaryAuth,
  authors: [],
  actions: [
    uploadResource,
    deleteResource,
    transformResource,
    findResourceByPublicId,
    createUsageReport
  ],
  triggers: [
    newResource,
    newTagAddedToAsset
  ],
}); 