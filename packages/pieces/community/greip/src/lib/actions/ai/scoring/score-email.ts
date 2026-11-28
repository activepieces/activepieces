import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipAiProps } from '../../../common/ai-props';
import { greipEmailOutputSchema } from '../../../output-schemas';

export const scoreEmailAction = createAction({
  auth: greipAuth,
  name: 'greip_score_email',
  outputSchema: greipEmailOutputSchema,
  displayName: 'Score Email',
  description: 'Get the risk level, recommendation and reasons for an email address.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Assess an email address for fraud risk (disposable domain, invalid mailbox, rules) and get a risk level, recommendation and reasons. Needs a Greip Premium plan.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to score.',
      required: true,
    }),
    userId: greipAiProps.userId({ required: false }),
  },
  async run(context) {
    const { email, userId } = context.propsValue;
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/score/email/${encodeURIComponent(email)}`,
      query: userId ? { user_id: userId } : {},
    });
  },
});
