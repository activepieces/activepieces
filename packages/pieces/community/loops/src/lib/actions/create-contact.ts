import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

// Reserved top-level fields that must not be overwritten by custom properties
const RESERVED_FIELDS = new Set(['email', 'firstName', 'lastName', 'userId', 'subscribed', 'userGroup', 'source']);

export const createContact = createAction({
  name: 'create_contact',
  displayName: 'Create or Update Contact',
  description:
    'Creates a new contact in Loops, or updates them if a contact with the given email already exists.',
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The contact\'s first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The contact\'s last name.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID for this contact.',
      required: false,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Subscribed to Marketing',
      description: 'Whether this contact should receive marketing emails. Leave unchecked to preserve existing subscription status on update.',
      required: false,
    }),
    userGroup: Property.ShortText({
      displayName: 'User Group',
      description: 'A group/segment to assign to this contact.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where this contact came from (e.g. "signup-form", "import").',
      required: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Additional custom contact properties as key-value pairs. Reserved fields (email, firstName, lastName, userId, subscribed, userGroup, source) are ignored here.',
      required: false,
    }),
  },
  async run(context) {
    const { email, firstName, lastName, userId, subscribed, userGroup, source, customProperties } =
      context.propsValue;

    const body: Record<string, unknown> = { email };

    if (firstName) body['firstName'] = firstName;
    if (lastName) body['lastName'] = lastName;
    if (userId) body['userId'] = userId;
    if (typeof subscribed === 'boolean') body['subscribed'] = subscribed;
    if (userGroup) body['userGroup'] = userGroup;
    if (source) body['source'] = source;

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
        Authorization: `Bearer ${context.auth as string}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    return response.body;
  },
});
