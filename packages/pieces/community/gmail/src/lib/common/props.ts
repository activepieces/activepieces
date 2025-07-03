import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GmailRequests } from './data';
import { GmailLabel } from './models';

export const GmailProps = {
  from: Property.ShortText({
    displayName: 'Email sender',
    description:
      'Optional filteration, leave empty to filter based on the email sender',
    required: false,
    defaultValue: '',
  }),
  to: Property.ShortText({
    displayName: 'Email recipient',
    description:
      'Optional filteration, leave empty to filter based on the email recipient',
    required: false,
    defaultValue: '',
  }),
  subject: Property.ShortText({
    displayName: 'Email subject',
    description: 'The email subject',
    required: false,
    defaultValue: '',
  }),
  category: Property.StaticDropdown({
    displayName: 'Category',
    description:
      'Optional filteration, leave unselected to filter based on the email category',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Social', value: 'social' },
        { label: 'Promotions', value: 'promotions' },
        { label: 'Updates', value: 'updates' },
        { label: 'Forums', value: 'forums' },
        { label: 'Reservations', value: 'reservations' },
        { label: 'Purchases', value: 'purchases' },
      ],
    },
  }),
  label: Property.Dropdown<GmailLabel>({
    displayName: 'Label',
    description:
      'Optional filteration, leave unselected to filter based on the email label',
    required: false,
    defaultValue: '',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'please authenticate first',
        };
      }

      const response = await GmailRequests.getLabels(
        auth as OAuth2PropertyValue
      );

      return {
        disabled: false,
        options: response.body.labels.map((label) => ({
          label: label.name,
          value: label,
        })),
      };
    },
  }),
  unread: (required = false) =>
    Property.Checkbox({
      displayName: 'Is unread?',
      description: 'Check if the email is unread or not',
      required,
      defaultValue: false,
    }),
};
