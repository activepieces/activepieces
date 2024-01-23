import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';

import { bubbleCreateThingAction } from './lib/actions/create-thing';
import { bubbleDeleteThingAction } from './lib/actions/delete-thing';
import { bubbleUpdateThingAction } from './lib/actions/update-thing';
import { bubbleListThingsAction } from './lib/actions/list-things';
import { bubbleGetThingAction } from './lib/actions/get-thing';

export const bubbleAuth = PieceAuth.CustomAuth({
  description: `Enter Bubble Connection Details
  In the bubble editor click Settings > API 
  1. Your app name is https://appname.bubbleapps.io
  2. Enter/Generate an API key
  `,
  props: {
    appname: Property.ShortText({
      displayName: 'App name',
      description: 'Enter the app name',
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Enter the access token',
      required: true,
    }),
  },
  // Optional Validation
  validate: async ({ auth }) => {
    if (auth) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Please enter a valid app name and token',
    };
  },
  required: true,
});

export const bubble = createPiece({
  displayName: 'Bubble',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bubble.png',
  authors: ['TaskMagicKyle'],
  actions: [
    bubbleCreateThingAction,
    bubbleDeleteThingAction,
    bubbleUpdateThingAction,
    bubbleGetThingAction,
    bubbleListThingsAction,
  ],
  triggers: [],
});
