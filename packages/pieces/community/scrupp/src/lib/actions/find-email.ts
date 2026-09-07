import { createAction, Property } from '@activepieces/pieces-framework';
import { scruppAuth } from '../auth';
import { runScruppJob } from '../common';
import { timeoutProp } from '../common/props';

export const findEmailAction = createAction({
  auth: scruppAuth,
  name: 'find-email',
  displayName: 'Find Email',
  description: "Find someone's email address from their first name, last name and company domain.",
  audience: 'both',
  aiMetadata: {
    description:
      "Finds a work email address from a person's first name, last name and their company domain. Returns the address with a confidence indication when one is found. Billed only for emails actually found.",
    idempotent: true,
  },
  props: {
    firstName: Property.ShortText({ displayName: 'First Name', required: true }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
    domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'For example openai.com',
      required: true,
    }),
    timeoutSeconds: timeoutProp,
  },
  async run(context) {
    const { firstName, lastName, domain, timeoutSeconds } = context.propsValue;

    return runScruppJob({
      auth: context.auth,
      type: 'email.initials',
      input: {
        items: [{ first_name: firstName, last_name: lastName, domain }],
      },
      idempotencyKey: `ap-${context.run.id}-find-email`,
      timeoutSeconds: timeoutSeconds ?? 900,
    });
  },
});
