
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { ML_ACTIONS } from './lib/actions';
import { API_CALLS_ACTIONS } from './lib/actions/api-calls';
import { API_TOKENS_ACTIONS } from './lib/actions/api-tokens';
import { FILE_ACTIONS } from './lib/actions/file';
import { META_ACTIONS } from './lib/actions/meta';
import { MODELING_ACTIONS } from './lib/actions/modeling';
import { ORGS_ACTIONS } from './lib/actions/orgs';
import { PAYMENTS_ACTIONS } from './lib/actions/payments';
import { SERVICE_ACCOUNTS_ACTIONS } from './lib/actions/service-accounts';
import { SHORTLINKS_ACTIONS } from './lib/actions/shortlinks';
import { UNIT_ACTIONS } from './lib/actions/unit';
import { USER_ACTIONS } from './lib/actions/users';

export const zooAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Zoo API Key (Bearer Token).',
});

export const textToCad = createPiece({
  displayName: 'Zoo',
  description: 'Generate and iterate on 3D models from text descriptions using ML endpoints.',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoo.jpg',
  auth: zooAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.20.0',
  authors: ['ahmad-swanblocks'],
  actions: [...ML_ACTIONS, ...API_CALLS_ACTIONS, ...API_TOKENS_ACTIONS, ...FILE_ACTIONS, ...META_ACTIONS, ...MODELING_ACTIONS, ...ORGS_ACTIONS, ...PAYMENTS_ACTIONS, ...SERVICE_ACCOUNTS_ACTIONS, ...SHORTLINKS_ACTIONS, ...UNIT_ACTIONS, ...USER_ACTIONS],
  triggers: [],
});    
    