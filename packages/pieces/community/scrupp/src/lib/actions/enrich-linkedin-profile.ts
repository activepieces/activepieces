import { createAction, Property } from '@activepieces/pieces-framework';
import { scruppAuth } from '../auth';
import { runScruppJob } from '../common';
import { timeoutProp } from '../common/props';

export const enrichLinkedinProfileAction = createAction({
  auth: scruppAuth,
  name: 'enrich-linkedin-profile',
  displayName: 'Enrich LinkedIn Profile',
  description: 'Return the full profile behind a LinkedIn profile URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Enriches a LinkedIn profile URL into structured data: name, headline, current role, company and location. Optionally finds the email as well. Costs one credit per record returned; empty results are refunded.',
    idempotent: true,
  },
  props: {
    profileUrl: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'For example https://www.linkedin.com/in/williamhgates/',
      required: true,
    }),
    withEmail: Property.Checkbox({
      displayName: 'Also Find Email',
      required: false,
      defaultValue: false,
    }),
    timeoutSeconds: timeoutProp,
  },
  async run(context) {
    const { profileUrl, withEmail, timeoutSeconds } = context.propsValue;

    return runScruppJob({
      auth: context.auth,
      type: withEmail ? 'email.linkedin' : 'linkedin.profile',
      input: { items: [profileUrl] },
      idempotencyKey: `ap-${context.run.id}-enrich-profile`,
      timeoutSeconds: timeoutSeconds ?? 900,
    });
  },
});
