import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { emailOctopusProps } from '../common/props';
import { findContactOutputSchema } from '../output-schemas';

export const findContactAction = createAction({
  auth: emailOctopusAuth,
  name: 'find_contact',
  outputSchema: findContactOutputSchema,
  classification: 'READ',
  displayName: 'Find Contact',
  description: 'Finds a contact by email address within a given list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up a single contact by email address within a specific EmailOctopus list and reports whether it was found. Use to check existence or retrieve a contact before acting on it; a missing contact returns a found:false result rather than erroring. Requires the list id and the email. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to find.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email_address } = context.propsValue;
    const contact = await emailOctopusApi.findContact({
      auth: context.auth,
      listId: list_id,
      emailAddress: email_address,
    });
    if (contact === null) {
      return { found: false, result: {} };
    }
    return { found: true, result: contact };
  },
});
