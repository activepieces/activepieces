import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaUploadAsset } from './lib/actions/upload-asset';
import { canvaCreateDesign } from './lib/actions/create-design';
import { canvaImportDesign } from './lib/actions/import-design';
import { canvaExportDesign } from './lib/actions/export-design';
import { canvaMoveFolderItem } from './lib/actions/move-folder-item';
import { canvaFindDesign } from './lib/actions/find-design';
import { canvaGetFolder } from './lib/actions/get-folder';
import { canvaGetImage } from './lib/actions/get-image';

export const canvaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  pkce: true,
  scope: [
    'asset:read',
    'asset:write',
    'design:meta:read',
    'design:content:read',
    'design:content:write',
    'folder:read',
    'folder:write',
  ],
});

export const canva = createPiece({
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  actions: [
    canvaUploadAsset,
    canvaCreateDesign,
    canvaImportDesign,
    canvaExportDesign,
    canvaMoveFolderItem,
    canvaFindDesign,
    canvaGetFolder,
    canvaGetImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.canva.com/rest/v1',
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Canva',
  description: 'Online design platform for visual content',
  authors: ['285729101'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [],
  auth: canvaAuth,
});
