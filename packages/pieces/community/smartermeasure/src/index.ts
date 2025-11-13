import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { customApiCallAction } from './lib/actions/custom-api-call';
import { assessmentCompletedTrigger, assessmentUpdatedTrigger } from './lib/triggers';

export const smarterMeasureAuth = PieceAuth.CustomAuth({
  description: 'Authentication for SmarterMeasure API',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
      description: 'Your SmarterMeasure username',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
      description: 'Your SmarterMeasure password',
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      description: 'The base URL of your SmarterMeasure instance (including protocol).',
      defaultValue: 'https://api.smartermeasure.com',
    }),
  },
  required: true,
});

export const smartermeasure = createPiece({
  displayName: "SmarterMeasure",
  auth: smarterMeasureAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/smartermeasure.png",
  authors: [
    'SmarterService'
  ],
  categories: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.BUSINESS_INTELLIGENCE
  ],
  description: 'Learning readiness assessment platform',
  actions: [customApiCallAction],
  triggers: [assessmentCompletedTrigger, assessmentUpdatedTrigger],
});
