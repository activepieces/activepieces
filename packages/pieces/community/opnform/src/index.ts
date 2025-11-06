
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { opnformNewSubmission } from './lib/triggers/new-submission';

export const opnformAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use your Opnform API Key. Click here for create API Key: https://opnform.com/home?user-settings=access-tokens',
});

export const opnform = createPiece({
  displayName: "Opnform",
  description: 'Create beautiful online forms and surveys with unlimited fields and submissions',

  auth: opnformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/opnform.png",
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ["JhumanJ","chiragchhatrala"],
  actions: [],
  triggers: [opnformNewSubmission],
});
    