import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { pcloudCommon } from './lib/common';
import { pcloudUploadFile } from './lib/actions/upload-file';
import { pcloudCreateFolder } from './lib/actions/create-folder';
import { pcloudDownloadFile } from './lib/actions/download-file';
import { pcloudCopyFile } from './lib/actions/copy-file';
import { pcloudFindFile } from './lib/actions/find-file';
import { pcloudFindFolder } from './lib/actions/find-folder';
import { pcloudNewFile } from './lib/triggers/new-file';
import { pcloudNewFolder } from './lib/triggers/new-folder';

export const pcloudAuth = PieceAuth.OAuth2({
  required: true,
  props: {
    region: Property.StaticDropdown({
      displayName: 'Data Center Region',
      description: 'Select the region where your pCloud account is hosted.',
      required: true,
      options: {
        options: [
          { label: 'United States (api.pcloud.com)', value: 'api.pcloud.com' },
          { label: 'Europe (eapi.pcloud.com)', value: 'eapi.pcloud.com' },
        ],
      },
    }),
  },
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://{region}/oauth2_token',
  scope: [],
});

export const pcloud = createPiece({
  displayName: 'pCloud',
  description: 'Secure cloud storage and file management',
  auth: pcloudAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pcloud.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['tarsassistant25-oss'],
  actions: [
    pcloudUploadFile,
    pcloudCreateFolder,
    pcloudDownloadFile,
    pcloudCopyFile,
    pcloudFindFile,
    pcloudFindFolder,
    createCustomApiCallAction({
      baseUrl: (auth) => pcloudCommon.getBaseUrl(auth as OAuth2PropertyValue),
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [pcloudNewFile, pcloudNewFolder],
});
