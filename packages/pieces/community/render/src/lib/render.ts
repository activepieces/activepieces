import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { listServices } from './actions/list-services';
import { getService } from './actions/get-service';
import { deployService } from './actions/deploy-service';
import { listDeploys } from './actions/list-deploys';
import { getDeploy } from './actions/get-deploy';

export const renderAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Render API key from https://dashboard.render.com/u/settings#api-keys',
  required: true,
});

export const render = createPiece({
  displayName: 'Render',
  auth: renderAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/render.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [listServices, getService, deployService, listDeploys, getDeploy],
  triggers: [],
});
