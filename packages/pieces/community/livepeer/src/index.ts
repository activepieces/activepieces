import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { getLptPrice } from './lib/actions/get-lpt-price';
import { getNetworkStats } from './lib/actions/get-network-stats';
import { getOrchestratorList } from './lib/actions/get-orchestrator-list';
import { getOrchestratorInfo } from './lib/actions/get-orchestrator-info';
import { getDelegatorInfo } from './lib/actions/get-delegator-info';

export const livepeer = createPiece({
  displayName: 'Livepeer',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://raw.githubusercontent.com/activepieces/activepieces/main/packages/pieces/community/livepeer/src/assets/livepeer.png',
  authors: ['bossco7598'],
  actions: [getLptPrice, getNetworkStats, getOrchestratorList, getOrchestratorInfo, getDelegatorInfo],
  triggers: [],
});
