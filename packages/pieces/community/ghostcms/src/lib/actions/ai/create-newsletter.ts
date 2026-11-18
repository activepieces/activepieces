import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostCommon } from '../../common/client';
import { NEWSLETTER_FIELDS, newsletterProps } from '../../common/newsletter-props';
import { ghostResource } from '../../common/resources';
import { ghostNewsletterOutputSchema } from '../../output-schemas';

export const ghostCreateNewsletter = createAction({
  auth: ghostAuth,
  name: 'ghost_create_newsletter',
  outputSchema: ghostNewsletterOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Newsletter',
  description: 'Create a new newsletter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a newsletter members can subscribe to; it changes the public signup options of the site. Opt In Existing Members subscribes every current member at once. The sender email is not set here because Ghost must verify it by email first. Each call creates a new newsletter.',
    idempotent: false,
  },
  props: {
    ...newsletterProps('create'),
    opt_in_existing: Property.Checkbox({
      displayName: 'Opt In Existing Members',
      description: 'Subscribe every existing member who is subscribed to at least one newsletter.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const body = ghostResource.pick(context.propsValue, NEWSLETTER_FIELDS);
    const subscribeOnSignup = ghostCommon.triState(context.propsValue.subscribe_on_signup);
    if (subscribeOnSignup !== undefined) {
      body['subscribe_on_signup'] = subscribeOnSignup;
    }
    return ghostResource.create(context.auth, 'newsletters', body, {
      opt_in_existing: context.propsValue.opt_in_existing === true ? 'true' : undefined,
    });
  },
});
