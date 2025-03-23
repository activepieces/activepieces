
import { createPiece } from '@activepieces/pieces-framework';
import { listEnsDomains } from './lib/actions/list-ens-domains';
import { ensCommon } from './lib/common/common';

export const ethNameService = createPiece({
  displayName: 'Ethereum Name Service (ENS)',
  description: 'Ethereum Name Service (ENS) is a decentralized naming system on the Ethereum blockchain.',
  auth: ensCommon.auth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://imagedelivery.net/bHREz764QO9n_1kIQUR2sw/1068cf28-f96b-4c73-6fd2-fbbd41863000/public',
  authors: ['Reem Ayoush - Swanblocks'],
  actions: [listEnsDomains],
  triggers: [],
});

