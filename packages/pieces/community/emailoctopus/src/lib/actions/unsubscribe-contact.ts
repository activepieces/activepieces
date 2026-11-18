import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { emailOctopusProps } from '../common/props';
import { contactOutputSchema } from '../output-schemas';

export const unsubscribeContactAction = createAction({
  auth: emailOctopusAuth,
  name: 'unsubscribe_contact',
  outputSchema: contactOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Contact',
  description: 'Sets a contact\'s status to "Unsubscribed" in a specific list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Marks a contact as unsubscribed in a specific EmailOctopus list, looked up by email address. Use to opt a known subscriber out of a list. Requires the list id and the contact email. Idempotent — re-running leaves the contact unsubscribed with no additional effect.',
    idempotent: true,
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to unsubscribe.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email_address } = context.propsValue;
    return await emailOctopusApi.updateContact({
      auth: context.auth,
      listId: list_id,
      contact: email_address,
      update: { status: 'unsubscribed' },
    });
  },
});
