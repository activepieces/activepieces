import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostNewsletterOutputSchema } from '../../output-schemas';

export const ghostGetNewsletter = createAction({
  auth: ghostAuth,
  name: 'ghost_get_newsletter',
  outputSchema: ghostNewsletterOutputSchema,
  classification: 'READ',
  displayName: 'Get Newsletter',
  description: 'Get a newsletter by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one newsletter by ID with its slug, status, sender and design settings.',
    idempotent: true,
  },
  props: {
    newsletter_id: ghostProps.id('Newsletter ID', 'The newsletter ID, from List Newsletters.'),
  },
  async run(context) {
    return ghostResource.get(
      context.auth,
      'newsletters',
      ghostCommon.id(context.propsValue.newsletter_id, 'Newsletter ID')
    );
  },
});
