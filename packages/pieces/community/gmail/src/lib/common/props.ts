import { Property } from '@activepieces/pieces-framework';
import { GmailRequests } from './data';
import { GmailLabel } from './models';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const GmailProps = {
  from: Property.ShortText({
    displayName: 'From',
    description: 'Only emails sent from this address.',
    placeholder: 'sender@example.com',
    required: false,
    defaultValue: '',
  }),
  to: Property.ShortText({
    displayName: 'To',
    description: 'Only emails sent to this address.',
    placeholder: 'you@example.com',
    required: false,
    defaultValue: '',
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: 'Only emails whose subject contains this text.',
    placeholder: 'Invoice',
    required: false,
    defaultValue: '',
  }),
  category: Property.StaticDropdown({
    displayName: 'Category',
    description: 'Only emails in this inbox tab, such as Primary or Promotions.',
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
  label: <R extends boolean = false>(overrides: {
    displayName?: string;
    description?: string;
    required: R;
  }) =>
    Property.Dropdown<GmailLabel, R, typeof gmailAuth>({
      auth: gmailAuth,
      displayName: overrides.displayName ?? 'Label',
      description: overrides.description ?? 'Only emails carrying this label.',
      required: overrides.required,
      defaultValue: '',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Gmail account first',
          };
        }

        try {
          const response = await GmailRequests.getLabels(auth);

          return {
            disabled: false,
            options: response.body.labels.map((label) => ({
              label: label.name,
              value: label,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not load labels. Check your connection.',
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
    description: 'Pick a recent message, or paste a message ID.',
    required: true,
    auth: gmailAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gmail account first',
        };
      }

      try {
        const authValue = auth as GmailAuthValue;
        const authClient = await createGoogleClient(authValue);

        const gmail = googleGmail({ version: 'v1', auth: authClient });

        const response = await GmailRequests.getRecentMessages(
          authValue,
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
    description: 'Pick a recent thread, or paste a thread ID.',
    required: true,
    refreshers: [],
    auth: gmailAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Gmail account first',
        };
      }

      try {
        const authValue = auth as GmailAuthValue;
        const authClient = await createGoogleClient(authValue);

        const gmail = googleGmail({ version: 'v1', auth: authClient });

        const response = await GmailRequests.getRecentThreads(
          authValue,
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
                const details = await gmail.users.threads.get({
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
