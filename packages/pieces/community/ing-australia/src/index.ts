import {
    createPiece,
    PieceAuth,
    Property,
  } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { downloadTransactions } from './lib/actions/download-transactions';

export const ingAustraliaAuth = PieceAuth.CustomAuth({
  description: 'Enter details required to authenticate with ING Bank Australia.',
  required: true,
  props: {
    username: Property.ShortText({
        displayName: 'Client number',
        required: true,
        description: 'Enter your ING Bank Australia client number.',
    }),
    password: PieceAuth.SecretText({
        displayName: 'PIN code',
        description: 'Enter your PIN code.',
        required: true,
    }),
    browserless_url: Property.LongText({
        displayName: 'Browserless URL',
        required: true,
        description: 'Enter a Browserless URL the configured token in the following format: ' +
        '192.168.1.10:3000?token=6R0W53R135510\n\n' +
        'Additional details: A Browserless service is required to be running, in order ' + 
        'to log into the ING Bank of Australia. This is because we need to make ' +
        'use of a web browser to insert your client number and pin code, to then ' + 
        'get acces to additional services, such as downloading transactions.\n\n' +
        'If one is self-hosting, one method to set up Browserless, is to create it ' +
        'via Docker Compose, within the ActivePieces Docker compose file.\n\n' +
        'Documentation can be found here: https://docs.browserless.io/docker/docker-quickstart/\n' +
        'The provided Docker run command can be converted to a Docker compose file via: ' +
        'https://www.composerize.com/',
    }),
  },
  // Optional Validation
  validate: async ({auth}) => {
      if(auth){
          return {
              valid: true,
          }
      }
      return {
          valid: false,
          error: ''
      }
  }
});

export const ingAustralia = createPiece({
  displayName: "ING Bank Australia",
  categories: [PieceCategory.ACCOUNTING],
  auth: ingAustraliaAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://www.ing.com.au/img/logos/ing.webp",
  authors: [],
  actions: [downloadTransactions],
  triggers: [],
});
