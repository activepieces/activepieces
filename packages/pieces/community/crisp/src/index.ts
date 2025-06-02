import { createPiece } from '@activepieces/pieces-framework';
import { crispAuth } from './lib/common/common';


export const crisp = createPiece({
  displayName: 'Crisp',
  logoUrl: 'https://website.crisp.chat/favicon-32x32.png',
  auth: crispAuth,
  authors: [''],
  description: 'Crisp is a customer messaging platform that allows businesses to communicate with their customers through various channels such as live chat, email, and social media.',
  actions: [
   
  ],
  triggers: [
    
  ],
});