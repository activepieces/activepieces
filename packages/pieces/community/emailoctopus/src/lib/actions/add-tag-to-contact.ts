import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { emailOctopusProps } from '../common/props';
import { contactOutputSchema } from '../output-schemas';

export const addTagToContactAction = createAction({
  auth: emailOctopusAuth,
  name: 'add_tag_to_contact',
  outputSchema: contactOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Tag to Contact',
  description: 'Add one or more tags to a contact in a specified list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Applies one or more tags to a contact in an EmailOctopus list, located by email address. Use to label or segment a known subscriber. Requires the list id, the contact email, and the tags to add. Idempotent — re-adding tags that are already present leaves the contact unchanged.',
    idempotent: true,
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: "The contact's email address.",
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags to add to the contact.',
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
        tags: Object.fromEntries(tags.map((tag) => [String(tag), true])),
      },
    });
  },
});
