import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipDetectProfanityOutputSchema } from '../../../output-schemas';

export const detectProfanityAction = createAction({
  auth: greipAuth,
  name: 'greip_detect_profanity',
  outputSchema: greipDetectProfanityOutputSchema,
  displayName: 'Detect Profanity',
  description: 'Check text for offensive or inappropriate language and get a risk level and recommendation.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Check a piece of text, such as a comment or username, for offensive or inappropriate language and get a risk level (low, medium, high) and a recommendation (accept, review, reject).',
    idempotent: true,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to check.',
      required: true,
    }),
  },
  async run(context) {
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/score/text',
      body: { text: context.propsValue.text },
    });
  },
});
