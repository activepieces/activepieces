
import { createPiece } from '@activepieces/pieces-framework';
import { listEnsDomains } from './lib/actions/list-ens-domains';
import { ensCommon } from './lib/common/common';

export const ethNameService = createPiece({
  displayName: 'Ethereum Name Service (ENS)',
  description: 'Ethereum Name Service (ENS) is a decentralized naming system on the Ethereum blockchain.',
  auth: ensCommon.auth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/eth-name-service.png',
  authors: ['reemayoush'],
  actions: [listEnsDomains],
  triggers: [],
});

