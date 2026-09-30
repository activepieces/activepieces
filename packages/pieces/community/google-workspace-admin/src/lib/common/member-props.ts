import { Property } from '@activepieces/pieces-framework';

function role<R extends boolean>(required: R) {
  return Property.StaticDropdown<string, R>({
    displayName: 'Role',
    required,
    defaultValue: required ? 'MEMBER' : undefined,
    options: {
      options: [
        { label: 'Member', value: 'MEMBER' },
        { label: 'Manager', value: 'MANAGER' },
        { label: 'Owner', value: 'OWNER' },
      ],
    },
  });
}

const deliverySettings = Property.StaticDropdown({
  displayName: 'Email Delivery',
  description: 'How this member receives group emails.',
  required: false,
  options: {
    options: [
      { label: 'Every email', value: 'ALL_MAIL' },
      { label: 'Daily digest (up to 25 messages)', value: 'DIGEST' },
      { label: 'Abridged daily summary', value: 'DAILY' },
      { label: 'No email', value: 'NONE' },
      { label: 'Disabled', value: 'DISABLED' },
    ],
  },
});

export const memberProps = { role, deliverySettings };
