import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/pieces-framework';
import { createCompanyUpdate } from './lib/actions/create-company-update';
import { createShareUpdate } from './lib/actions/create-share-update';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { linkedinCommon } from './lib/common';
import { createMemberPost } from './lib/actions/create-member-post';
import { getCurrentMemberProfile } from './lib/actions/get-current-member-profile';
import { listManagedOrganizations } from './lib/actions/list-managed-organizations';
import { updatePostCommentary } from './lib/actions/update-post-commentary';
import { deletePost } from './lib/actions/delete-post';
import { createImageUploadUrl } from './lib/actions/create-image-upload-url';

export const linkedinAuth = PieceAuth.OAuth2({
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  required: true,
  scope: [
    'w_member_social',
    'w_organization_social',
    'rw_organization_admin',
    'openid',
    'email',
    'profile',
  ],
});

export const linkedin = createPiece({
  displayName: 'LinkedIn',
  description: 'Connect and network with professionals',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/linkedin.png',
  categories: [PieceCategory.MARKETING],
  authors: ["aasimsani","kishanprmr","MoShizzle","khaledmashaly","abuaboud", "izdrail"],
  auth: linkedinAuth,
  actions: [
    createShareUpdate,
    createCompanyUpdate,
    getCurrentMemberProfile,
    listManagedOrganizations,
    createMemberPost,
    updatePostCommentary,
    deletePost,
    createImageUploadUrl,
    createCustomApiCallAction({
      auth: linkedinAuth,
      baseUrl: () => {
        return linkedinCommon.baseUrl;
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
