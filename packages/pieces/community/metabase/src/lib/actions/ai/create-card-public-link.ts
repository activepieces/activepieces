import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateCardPublicLinkOutputSchema } from '../../output-schemas';

export const createCardPublicLinkAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_card_public_link',
  outputSchema: metabaseCreateCardPublicLinkOutputSchema,
  displayName: 'Create Card Public Link',
  description: 'Create a public, no-login link to a saved question.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a question (card) viewable by anyone with the link and returns its public UUID; the link is {base URL}/public/question/{uuid}. Returns the existing UUID if the card is already shared. Needs an admin key and public sharing enabled.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createCardPublicLink({
      auth,
      cardId: propsValue.cardId,
    });
  },
});
