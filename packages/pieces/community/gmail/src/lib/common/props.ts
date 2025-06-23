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
  message: Property.Dropdown({
    displayName: 'Message',
    description: 'Select a message from the list or enter a message ID manually',
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
        const response = await GmailRequests.getRecentMessages(
          auth as OAuth2PropertyValue,
          20 // Get last 20 messages
        );

        if (!response.body.messages || response.body.messages.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No recent messages found. You can enter a message ID manually.',
          };
        }

        // Get message details for better display
        const messageDetails = await Promise.all(
          response.body.messages.slice(0, 10).map(async (msg: { id: string; threadId: string }) => {
            try {
              const details = await GmailRequests.getMail({
                access_token: (auth as OAuth2PropertyValue).access_token,
                message_id: msg.id,
                format: 'metadata' as any,
              });

              const headers = details.payload?.headers || [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
              const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
              const date = headers.find((h: any) => h.name === 'Date')?.value || '';
              
              // Format date to be more readable
              const formattedDate = date ? new Date(date).toLocaleDateString() : '';
              
              return {
                id: msg.id,
                subject: subject.length > 50 ? subject.substring(0, 50) + '...' : subject,
                from: from.length > 30 ? from.substring(0, 30) + '...' : from,
                date: formattedDate,
              };
            } catch (error) {
              return {
                id: msg.id,
                subject: 'Unable to load details',
                from: 'Unknown',
                date: '',
              };
            }
          })
        );

        return {
          disabled: false,
          options: messageDetails.map((msg) => ({
            label: `${msg.subject} - From: ${msg.from} ${msg.date ? `(${msg.date})` : ''}`,
            value: msg.id,
          })),
        };
      } catch (error) {
        return {
          disabled: false,
          options: [],
          placeholder: 'Error loading recent messages. You can enter a message ID manually.',
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
        const response = await GmailRequests.getRecentThreads(
          auth as OAuth2PropertyValue,
          15 // Get last 15 threads
        );

        if (!response.body.threads || response.body.threads.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No recent threads found. You can enter a thread ID manually.',
          };
        }

        // Get thread details for better display
        const threadDetails = await Promise.all(
          response.body.threads.slice(0, 10).map(async (thread: { id: string; snippet?: string }) => {
            try {
              const details = await GmailRequests.getThread({
                access_token: (auth as OAuth2PropertyValue).access_token,
                thread_id: thread.id,
                format: 'metadata' as any,
              });

              // Get the first message to extract subject and participants
              const firstMessage = details.messages?.[0];
              const headers = firstMessage?.payload?.headers || [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
              const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
              const messageCount = details.messages?.length || 0;
              
              return {
                id: thread.id,
                subject: subject.length > 40 ? subject.substring(0, 40) + '...' : subject,
                from: from.length > 25 ? from.substring(0, 25) + '...' : from,
                messageCount: messageCount,
                snippet: (thread.snippet || '').length > 30 ? 
                  (thread.snippet || '').substring(0, 30) + '...' : (thread.snippet || ''),
              };
            } catch (error) {
              return {
                id: thread.id,
                subject: 'Unable to load details',
                from: 'Unknown',
                messageCount: 0,
                snippet: '',
              };
            }
          })
        );

        return {
          disabled: false,
          options: threadDetails.map((thread) => ({
            label: `${thread.subject} - ${thread.messageCount} msg(s) - From: ${thread.from}`,
            value: thread.id,
          })),
        };
      } catch (error) {
        return {
          disabled: false,
          options: [],
          placeholder: 'Error loading recent threads. You can enter a thread ID manually.',
        };
      }
    },
  }),
};
