import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/shared';
import actions from './lib/actions';
import triggers from './lib/triggers';

export const clockodoAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    email: Property.ShortText({
      displayName: 'E-Mail',
      required: true,
      description: 'The email of your clockodo user',
    }),
    token: PieceAuth.SecretText({
      displayName: 'API-Token',
      description: 'Your api token (can be found in profile settings)',
      required: true,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Your company name or app name',
      required: true,
    }),
    company_email: Property.ShortText({
      displayName: 'Company E-Mail',
      description: 'A contact email for your company or app',
      required: true,
    }),
  },
});

export const clockodo = createPiece({
  displayName: 'Clockodo',
  description: 'Time tracking made easy',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clockodo.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["JanHolger","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: clockodoAuth,
  actions,
  triggers,
});
