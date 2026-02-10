import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { identifyAction } from './lib/actions/identify';
import { trackAction } from './lib/actions/track';
import { screenAction } from './lib/actions/screen';

export const dittofeedAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your API key of Dittofeed.',
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      description: 'The base URL of your Dittofeed instance.',
      defaultValue: 'http://localhost:3200',
    }),
  },
  required: true,
});

export const dittofeed = createPiece({
  displayName: "Dittofeed",
  auth: dittofeedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/dittofeed.png",
  authors: [
    'SmarterService'
  ],
  categories: [
    PieceCategory.MARKETING,
    PieceCategory.BUSINESS_INTELLIGENCE
  ],
  description: 'Customer data platform for user analytics and tracking',
  actions: [identifyAction, trackAction, screenAction],
  triggers: [],
});
    