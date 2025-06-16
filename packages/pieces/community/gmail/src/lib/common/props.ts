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
  labels: Property.MultiSelectDropdown<GmailLabel>({
    displayName: 'Labels',
    description: 'Select one or more labels',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }

      const response = await GmailRequests.getLabels(
        auth as OAuth2PropertyValue
      );

      // Filter out system labels for adding (keep only user-created labels and some key system labels)
      const selectableLabels = response.body.labels.filter((label) => 
        label.type === 'user' || 
        ['INBOX', 'STARRED', 'IMPORTANT', 'SENT', 'DRAFT'].includes(label.id)
      );

      return {
        disabled: false,
        options: selectableLabels.map((label) => ({
          label: `${label.name} ${label.type === 'system' ? '(System)' : ''}`,
          value: label,
        })),
      };
    },
     }),
  labelsToRemove: Property.MultiSelectDropdown<GmailLabel>({
    displayName: 'Labels to Remove',
    description: 'Select one or more labels to remove from the message',
    required: true,
    refreshers: ['message_id'],
    options: async ({ auth, message_id }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }

      try {
        const response = await GmailRequests.getLabels(
          auth as OAuth2PropertyValue
        );

        let availableLabels = response.body.labels;

        if (message_id) {
          try {
            const messageResponse = await GmailRequests.getMail({
              access_token: (auth as OAuth2PropertyValue).access_token,
              message_id: message_id as string,
              format: 'minimal' as any,
            });

            const currentLabelIds = messageResponse.labelIds || [];
            
            availableLabels = response.body.labels.filter(label => 
              currentLabelIds.includes(label.id)
            );
          } catch (error) {
            console.warn('Could not fetch current message labels, showing all removable labels');
          }
        }

        const removableLabels = availableLabels.filter((label) => 
          label.type === 'user' || 
          ['STARRED', 'IMPORTANT', 'UNREAD'].includes(label.id)
        );

        if (removableLabels.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: message_id ? 'No removable labels found on this message' : 'No removable labels available',
          };
        }

        return {
          disabled: false,
          options: removableLabels.map((label) => ({
            label: `${label.name} ${label.type === 'system' ? '(System)' : ''}`,
            value: label,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading labels',
        };
      }
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
