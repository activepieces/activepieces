import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipBinOutputSchema } from '../../../output-schemas';

export const lookupBinAction = createAction({
  auth: greipAuth,
  name: 'greip_lookup_bin',
  outputSchema: greipBinOutputSchema,
  displayName: 'Look Up Card BIN',
  description: 'Get the issuing bank, card brand, type and country of a card from its first 6 to 8 digits.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Get the issuer, brand, card type and issuing country for a card BIN/IIN (its first 6 to 8 digits). Use before a payment to compare the card country with the customer IP country; Score Payment does the full fraud check.',
    idempotent: true,
  },
  props: {
    bin: Property.ShortText({
      displayName: 'Card BIN',
      description: 'The first 6 to 8 digits of the card number.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { bin, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lookup/bin/${encodeURIComponent(bin)}`,
      query: userId ? { user_id: userId } : {},
    });
  },
});
