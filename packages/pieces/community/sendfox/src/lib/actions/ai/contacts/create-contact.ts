import { createAction, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../../../auth';
import { sendfoxApi } from '../../../common/api';
import { createContactOutputSchema } from '../../../output-schemas';

export const createContactAiAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_create_contact',
  outputSchema: createContactOutputSchema,
  displayName: 'Create Contact',
  description: 'Add a contact to SendFox, optionally to lists',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a contact by email, with optional first and last name, IP address, custom field values and lists to join. Returns the contact with its ID. Use Add Contact to List for a contact that already exists. List IDs come from List Lists; custom field names from List Contact Fields.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact, e.g. "jane@example.com".',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    ipAddress: Property.ShortText({
      displayName: 'IP Address',
      description: 'IP address the contact signed up from, e.g. "203.0.113.7".',
      required: false,
    }),
    listIds: Property.Array({
      displayName: 'List IDs',
      description: 'IDs of lists to add the contact to, e.g. ["123456"]. Use List Lists to find them. Leave empty to add the contact to no list.',
      required: false,
    }),
    contactFields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Values for custom contact fields. Each item has the field `name` (from List Contact Fields) and its `value`.',
      required: false,
      properties: {
        name: Property.ShortText({ displayName: 'Field Name', required: true }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
  },
  async run(context) {
    const { email, firstName, lastName, ipAddress, listIds, contactFields } =
      context.propsValue;
    return await sendfoxApi.createContact({
      auth: context.auth,
      email,
      firstName,
      lastName,
      ipAddress,
      lists: listIds?.map((id) => String(id)),
      contactFields,
    });
  },
});
