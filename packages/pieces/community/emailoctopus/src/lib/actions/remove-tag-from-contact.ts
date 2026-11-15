import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { emailOctopusProps } from '../common/props';
import { contactOutputSchema } from '../output-schemas';

export const removeTagFromContactAction = createAction({
  auth: emailOctopusAuth,
  name: 'remove_tag_from_contact',
  outputSchema: contactOutputSchema,
  classification: 'WRITE',
  displayName: 'Remove Tag from Contact',
  description: 'Remove one or more tags from a contact in a specified list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Removes one or more tags from a contact in an EmailOctopus list, located by email address. Use to unlabel or re-segment a known subscriber. Requires the list id, the contact email, and the tags to remove. Idempotent — removing tags the contact no longer has leaves it unchanged.',
    idempotent: true,
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to modify.',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags to remove from the contact.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, email_address, tags } = context.propsValue;
    return await emailOctopusApi.updateContact({
      auth: context.auth,
      listId: list_id,
      contact: email_address,
      update: {
        tags: Object.fromEntries(tags.map((tag) => [String(tag), false])),
      },
    });
  },
});
