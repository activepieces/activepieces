import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaUploadAsset } from './lib/actions/upload-asset';
import { canvaUploadAssetFromUrl } from './lib/actions/upload-asset-from-url';
import { canvaCreateDesign } from './lib/actions/create-design';
import { canvaExportDesign } from './lib/actions/export-design';
import { canvaListDesigns } from './lib/actions/list-designs';
import { canvaGetDesign } from './lib/actions/get-design';
import { canvaCreateFolder } from './lib/actions/create-folder';
import { canvaListFolderItems } from './lib/actions/list-folder-items';

export const canvaAuth = PieceAuth.OAuth2({
  description: 'Connect to your Canva account',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  scope: [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'asset:read',
    'asset:write',
    'folder:read',
    'folder:write',
    'profile:read',
  ],
});

export const canva = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  actions: [
    canvaUploadAsset,
    canvaUploadAssetFromUrl,
    canvaCreateDesign,
    canvaExportDesign,
    canvaListDesigns,
    canvaGetDesign,
    canvaCreateFolder,
    canvaListFolderItems,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.canva.com/rest/v1',
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Canva',
  description: 'Design platform for creating visual content',
  authors: ['claude-code'],
  categories: [PieceCategory.MARKETING],
  auth: canvaAuth,
  triggers: [],
});
