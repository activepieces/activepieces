import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipIbanOutputSchema } from '../../../output-schemas';

export const validateIbanAction = createAction({
  auth: greipAuth,
  name: 'greip_validate_iban',
  outputSchema: greipIbanOutputSchema,
  displayName: 'Validate IBAN',
  description: 'Check whether an IBAN is valid and get the country it belongs to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Check an International Bank Account Number for validity and get its country details. Use before sending a payout. Needs a Greip Premium plan.',
    idempotent: true,
  },
  props: {
    iban: Property.ShortText({
      displayName: 'IBAN',
      description: 'The International Bank Account Number, e.g. GB33BUKB20201555555555.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { iban, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lookup/iban/${encodeURIComponent(iban)}`,
      query: userId ? { user_id: userId } : {},
    });
  },
});
