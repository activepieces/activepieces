import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { emailOctopusProps } from '../common/props';
import { contactOutputSchema } from '../output-schemas';

export const updateContactEmailAction = createAction({
  auth: emailOctopusAuth,
  name: 'update_contact_email',
  outputSchema: contactOutputSchema,
  classification: 'WRITE',
  displayName: "Update Contact's Email Address",
  description: 'Change the email address of a contact in a list.',
  audience: 'human',
  aiMetadata: {
    description:
      "Changes a contact's email address within an EmailOctopus list, locating the contact by its current email. Use to correct or migrate a subscriber's address. Requires the list id, the current email (used to find the record), and the new email. Not idempotent — once changed, the original email no longer resolves to the contact, so a repeated call with the same inputs will not match.",
    idempotent: false,
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
    current_email_address: Property.ShortText({
      displayName: 'Current Email Address',
      description: "The contact's current email address used to find them.",
      required: true,
    }),
    new_email_address: Property.ShortText({
      displayName: 'New Email Address',
      description: 'The new email address for the contact.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, current_email_address, new_email_address } =
      context.propsValue;
    return await emailOctopusApi.updateContact({
      auth: context.auth,
      listId: list_id,
      contact: current_email_address,
      update: { email_address: new_email_address },
    });
  },
});
