import { createAction, Property } from '@activepieces/pieces-framework';
import { loopsAuth, LOOPS_BASE_URL, loopsAuthHeaders } from '../auth';

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
      description: 'Whether this contact should receive marketing emails.',
      required: false,
      defaultValue: true,
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
      description: 'Additional custom contact properties as key-value pairs.',
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
    if (customProperties && typeof customProperties === 'object') {
      for (const [key, value] of Object.entries(customProperties)) {
        if (key !== 'email') {
          body[key] = value;
        }
      }
    }

    const response = await fetch(`${LOOPS_BASE_URL}/contacts/create`, {
      method: 'POST',
      headers: loopsAuthHeaders(context.auth as string),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Loops API error ${response.status}: ${JSON.stringify(data)}`
      );
    }

    return data;
  },
});
