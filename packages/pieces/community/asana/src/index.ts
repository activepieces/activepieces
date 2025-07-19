import { createCustomApiCallAction } from '@ensemble/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { asanaCreateTaskAction } from './lib/actions/create-task';

export const asanaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://app.asana.com/-/oauth_authorize',
  tokenUrl: 'https://app.asana.com/-/oauth_token',
  required: true,
  scope: ['default'],
});

export const asana = createPiece({
  displayName: 'Asana',
  description: "Work management platform designed to help teams organize, track, and manage their work.",
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/asana.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["ShayPunter","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: asanaAuth,
  actions: [
    asanaCreateTaskAction,
    createCustomApiCallAction({
      baseUrl: () => `https://app.asana.com/api/1.0`,
      auth: asanaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
