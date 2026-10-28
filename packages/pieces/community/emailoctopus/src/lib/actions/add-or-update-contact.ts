import { createAction, Property } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from '../common/api';
import { emailOctopusProps } from '../common/props';
import { contactOutputSchema } from '../output-schemas';

export const addOrUpdateContactAction = createAction({
  auth: emailOctopusAuth,
  name: 'add_or_update_contact',
  outputSchema: contactOutputSchema,
  classification: 'WRITE',
  displayName: 'Add / Update Contact',
  description:
    'Adds a new contact to a list or updates an existing contact if one exists.',
  audience: 'human',
  aiMetadata: {
    description:
      'Upserts a contact into an EmailOctopus list by email address: creates it if absent, otherwise updates its fields, status, and tags. Use to ensure a subscriber exists or to set/refresh their details in one call. Requires the target list id and email; supplied tags are merged in (existing tags are not removed). Idempotent — repeating with the same input converges to the same contact state.',
    idempotent: true,
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: "The contact's email address.",
      required: true,
    }),
    fields: emailOctopusProps.fields({ required: true }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Tags to associate with the contact. Existing tags will not be removed.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the contact.',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
  },
  async run(context) {
    const { list_id, email_address, fields, tags, status } =
      context.propsValue;
    return await emailOctopusApi.upsertContact({
      auth: context.auth,
      listId: list_id,
      emailAddress: email_address,
      fields,
      tags: tags?.map(String),
      status,
    });
  },
});
