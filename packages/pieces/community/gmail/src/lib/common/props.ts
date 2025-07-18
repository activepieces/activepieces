import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GmailRequests } from './data';
import { GmailLabel } from './models';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

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
      const selectableLabels = response.body.labels.filter(
        (label) =>
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
    description: 'Select one or more labels to remove from the message.',
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

            availableLabels = response.body.labels.filter((label) =>
              currentLabelIds.includes(label.id)
            );
          } catch (error) {
            console.warn(
              'Could not fetch current message labels, showing all removable labels'
            );
          }
        }

        const removableLabels = availableLabels.filter(
          (label) =>
            label.type === 'user' ||
            ['STARRED', 'IMPORTANT', 'UNREAD'].includes(label.id)
        );

        if (removableLabels.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: message_id
              ? 'No removable labels found on this message'
              : 'No removable labels available',
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
  message: Property.Dropdown({
    displayName: 'Message',
    description:
      'Select a message from the list or enter a message ID manually.',
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

      try {
        const authValue = auth as OAuth2PropertyValue;
        const authClient = new OAuth2Client();
        authClient.setCredentials(authValue);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const response = await GmailRequests.getRecentMessages(
          auth as OAuth2PropertyValue,
          20 // Get last 20 messages
        );

        if (!response.body.messages || response.body.messages.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder:
              'No recent messages found. You can enter a message ID manually.',
          };
        }

        // Get message details for better display
        const messageDetails = await Promise.all(
          response.body.messages
            .slice(0, 10)
            .map(async (msg: { id: string; threadId: string }) => {
              try {
                const details = await gmail.users.messages.get({
                  metadataHeaders: ['Subject'],
                  format: 'metadata',
                  id: msg.id,
                  userId: 'me',
                });

                const headers = details.data.payload?.headers || [];
                const subject =
                  headers.find((h: any) => h.name === 'Subject')?.value ||
                  'No Subject';

                return {
                  id: msg.id,
                  subject:
                    subject.length > 50
                      ? subject.substring(0, 50) + '...'
                      : subject,
                };
              } catch (error) {
                console.log(error);
                return {
                  id: msg.id,
                  subject: 'Unable to load details',
                };
              }
            })
        );

        return {
          disabled: false,
          options: messageDetails.map((msg) => ({
            label: msg.subject,
            value: msg.id,
          })),
        };
      } catch (error) {
        return {
          disabled: false,
          options: [],
          placeholder:
            'Error loading recent messages. You can enter a message ID manually.',
        };
      }
    },
  }),
  thread: Property.Dropdown({
    displayName: 'Thread',
    description: 'Select a thread from the list or enter a thread ID manually',
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

      try {
        const authValue = auth as OAuth2PropertyValue;
        const authClient = new OAuth2Client();
        authClient.setCredentials(authValue);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const response = await GmailRequests.getRecentThreads(
          auth as OAuth2PropertyValue,
          15 // Get last 15 threads
        );

        if (!response.body.threads || response.body.threads.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder:
              'No recent threads found. You can enter a thread ID manually.',
          };
        }

        // Get thread details for better display
        const threadDetails = await Promise.all(
          response.body.threads
            .slice(0, 10)
            .map(async (thread: { id: string; snippet?: string }) => {
              try {
                const details = await await gmail.users.threads.get({
                  metadataHeaders: ['Subject'],
                  format: 'metadata',
                  id: thread.id,
                  userId: 'me',
                });
                // Get the first message to extract subject and participants
                const firstMessage = details.data.messages?.[0];
                const headers = firstMessage?.payload?.headers || [];
                const subject =
                  headers.find((h: any) => h.name === 'Subject')?.value ||
                  'No Subject';

                return {
                  id: thread.id,
                  subject:
                    subject.length > 50
                      ? subject.substring(0, 50) + '...'
                      : subject,
                };
              } catch (error) {
                return {
                  id: thread.id,
                  subject: 'Unable to load details',
                };
              }
            })
        );

        return {
          disabled: false,
          options: threadDetails.map((thread) => ({
            label: thread.subject,
            value: thread.id,
          })),
        };
      } catch (error) {
        return {
          disabled: false,
          options: [],
          placeholder:
            'Error loading recent threads. You can enter a thread ID manually.',
        };
      }
    },
  }),
};
