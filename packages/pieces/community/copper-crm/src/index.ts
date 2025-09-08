import { createPiece } from '@activepieces/pieces-framework';
import { copperAuth } from './lib/common/auth';

export const copper = createPiece({
    displayName: 'Copper CRM',
    logoUrl: 'https://cdn.activepieces.com/pieces/copper.png',
    auth: copperAuth,
    authors: ['0xmoner'],
    actions: [
    ],
    triggers: [
    ],
});