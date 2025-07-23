import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { BitlyAuth } from './lib/common/auth';
import { arch } from 'os';
import { getBitlinkDetails } from './lib/actions/get-bitlink-details';
import { createBitlink } from './lib/actions/create-bitlink';
import { archiveBitlink } from './lib/actions/archive-bitlink';
import { createQrCode } from './lib/actions/create-qr-code';
import { updateBitlink } from './lib/actions/update-bitlink';

export const bitly = createPiece({
  displayName: 'Bitly',
  auth: BitlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bitly.png',
  authors: ['Sanket6652'],
  actions: [
    archiveBitlink,
    createBitlink,
    createQrCode,
    getBitlinkDetails,
    updateBitlink,  
  ],
  triggers: [],
});
