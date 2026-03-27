import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

// Reserved top-level fields that must not be overwritten by custom properties
const RESERVED_FIELDS = new Set([
  'email',
  'firstName',
  'lastName',
  'userId',
  'subscribed',
  'userGroup',
  'source',
]);

export const createContact = createAction({
  name: 'create_contact',
  displayName: 'Create Contact',
  description:
    'Creates a new contact in Loops. Returns an error if a contact with the given email already exists.',
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name.",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "The contact's last name.",
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID for this contact.',
      required: false,
    }),
    subscribed: Property.StaticDropdown({
      displayName: 'Subscribed to Marketing',
      description:
        'Set subscription status. Leave as "No Change" to preserve existing status on update.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'No Change', value: 'no_change' },
          { label: 'Subscribe', value: 'true' },
          { label: 'Unsubscribe', value: 'false' },
        ],
      },
    }),
    userGroup: Property.ShortText({
      displayName: 'User Group',
      description: 'A group/segment to assign to this contact.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description:
        'Where this contact came from (e.g. "signup-form", "import").',
      required: false,
    }),
    mailingLists: Property.Object({
      displayName: 'Mailing Lists',
      description:
        'Subscribe or unsubscribe this contact from mailing lists. Provide list IDs as keys with `true` (subscribe) or `false` (unsubscribe) as values.',
      required: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      description:
        'Additional custom contact properties as key-value pairs. Reserved fields (email, firstName, lastName, userId, subscribed, userGroup, source) are ignored here.',
      required: false,
    }),
  },
  async run(context) {
    const {
      email,
      firstName,
      lastName,
      userId,
      subscribed,
      userGroup,
      source,
      mailingLists,
      customProperties,
    } = context.propsValue;

    const body: Record<string, unknown> = { email };

    if (firstName) body['firstName'] = firstName;
    if (lastName) body['lastName'] = lastName;
    if (userId) body['userId'] = userId;
    if (subscribed === 'true') body['subscribed'] = true;
    if (subscribed === 'false') body['subscribed'] = false;
    if (userGroup) body['userGroup'] = userGroup;
    if (source) body['source'] = source;
    if (mailingLists && typeof mailingLists === 'object') {
      body['mailingLists'] = mailingLists;
    }

    // Merge custom properties at the top level (Loops expects flat properties)
    // Skip any key that is a reserved field to prevent silent overwrites
    if (customProperties && typeof customProperties === 'object') {
      for (const [key, value] of Object.entries(customProperties)) {
        if (!RESERVED_FIELDS.has(key)) {
          body[key] = value;
        }
      }
    }

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `${LOOPS_BASE_URL}/contacts/create`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    return response.body;
  },
});
