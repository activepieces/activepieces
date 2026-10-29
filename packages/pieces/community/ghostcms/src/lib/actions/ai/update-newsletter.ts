import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { applyClearFields, clearFieldsProp } from '../../common/clear-fields';
import { ghostCommon } from '../../common/client';
import { NEWSLETTER_FIELDS, newsletterProps } from '../../common/newsletter-props';
import { ghostResource } from '../../common/resources';
import { ghostNewsletterOutputSchema } from '../../output-schemas';

export const ghostUpdateNewsletter = createAction({
  auth: ghostAuth,
  name: 'ghost_update_newsletter',
  outputSchema: ghostNewsletterOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Newsletter',
  description: 'Update the name or settings of a newsletter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a newsletter by ID; only the inputs you supply change, and Clear Fields blanks the description or sender name. It cannot archive the newsletter (use Archive Newsletter) or change the sender email, which Ghost must verify by email first.',
    idempotent: true,
  },
  props: {
    newsletter_id: ghostProps.id('Newsletter ID', 'The newsletter ID, from List Newsletters.'),
    ...newsletterProps('update'),
    clear_fields: clearFieldsProp([
      { label: 'Description', value: 'description' },
      { label: 'Sender Name', value: 'sender_name' },
    ]),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.newsletter_id, 'Newsletter ID');
    const body = applyClearFields({
      body: ghostResource.pick(context.propsValue, NEWSLETTER_FIELDS),
      clear: context.propsValue.clear_fields,
      allowed: ['description', 'sender_name'],
      clearValue: null,
    });
    const subscribeOnSignup = ghostCommon.triState(context.propsValue.subscribe_on_signup);
    if (subscribeOnSignup !== undefined) {
      body['subscribe_on_signup'] = subscribeOnSignup;
    }
    return ghostResource.edit(context.auth, 'newsletters', id, body);
  },
});
