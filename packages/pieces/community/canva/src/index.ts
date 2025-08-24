import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaCommon } from './lib/common';
import { createDesign } from './lib/actions/create-design';
import { getDesign } from './lib/actions/get-design';
import { uploadAsset } from './lib/actions/upload-asset';
import { importDesign } from './lib/actions/import-design';
import { exportDesign } from './lib/actions/export-design';
import { moveFolderItem } from './lib/actions/move-folder-item';
import { findDesign } from './lib/actions/find-design';
import { getFolder } from './lib/actions/get-folder';
import { getAsset } from './lib/actions/get-asset';

export const canvaAuth = PieceAuth.OAuth2({
  description: `Authentication for Canva API

📋 **Required Scopes** (enable these in your Canva integration settings):
✅ **design:content** - Read & Write (for creating, editing, importing, and exporting designs)
✅ **design:meta** - Read (for finding and listing designs)  
✅ **asset** - Read & Write (for uploading and managing assets)
✅ **folder** - Read & Write (for organizing designs and moving items)

🔗 Configure scopes at: https://canva.com/developers/integrations → Your Integration → Configuration → Scopes`,
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  pkce: true,
  pkceMethod: 'S256',
  scope: [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'asset:read',
    'asset:write',
    'folder:read',
    'folder:write',
  ],
  validate: async ({ auth }) => {
    try {
      const authValue = auth as OAuth2PropertyValue;
      if (!authValue.access_token) {
        return { valid: false, error: 'No access token found' };
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${canvaCommon.baseUrl}/users/me`,
        headers: {
          Authorization: `Bearer ${authValue.access_token}`,
        },
      });

      if (response.status === 200) {
        return { valid: true };
      }
      
      return { valid: false, error: 'Invalid or expired access token' };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Access token is invalid or expired' };
      }
      return { valid: false, error: 'Failed to validate authentication credentials' };
    }
  },
});

export const canva = createPiece({
  displayName: 'Canva',
  description: 'Create stunning designs with Canva\'s powerful design automation tools',
  auth: canvaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['onyedikachi-david'],
  actions: [
    createDesign,
    getDesign,
    uploadAsset,
    importDesign,
    exportDesign,
    moveFolderItem,
    findDesign,
    getFolder,
    getAsset,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.canva.com/rest/v1',
      auth: canvaAuth,
      authMapping: async (auth) => {
        const authValue = auth as OAuth2PropertyValue;
        return {
          Authorization: `Bearer ${authValue.access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
    