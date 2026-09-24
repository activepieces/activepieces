import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { convertAttachment, parseStream } from '../common/data';
import { GmailProps } from '../common/props';
import { gmailSearchMailActionOutputSchema } from '../output-schemas';

export const gmailSearchMailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_search_mail',
  classification: 'SEARCH',
  displayName: 'Find Email',
  description:
    'Search your mailbox; with no filters it returns the latest emails.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches the mailbox for emails matching combinable filters (sender, recipient, subject, body text, label, category, date range, attachment presence/name) and returns the matched messages with parsed contents. Use this to locate messages or discover their IDs before reading or replying; with no filters it returns the most recent emails. Bound results with Max Results (1-500, default 10). Idempotent: a read-only search that does not modify the mailbox.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'people',
      display: 'builder',
      label: 'People',
      icon: 'users',
      props: ['from', 'to'],
    },
    {
      key: 'content',
      display: 'builder',
      label: 'Content',
      icon: 'type',
      props: ['subject', 'content'],
    },
    {
      key: 'attachments',
      display: 'builder',
      label: 'Attachments',
      icon: 'paperclip',
      props: ['has_attachment', 'attachment_name'],
    },
    {
      key: 'mailbox',
      display: 'builder',
      label: 'Mailbox',
      icon: 'inbox',
      props: ['label', 'category', 'include_spam_trash'],
    },
    {
      key: 'date',
      display: 'builder',
      label: 'Date',
      icon: 'calendar',
      props: ['after_date', 'before_date'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['max_results'],
    },
  ],
  props: {
    from: { ...GmailProps.from, icon: 'user' },
    to: { ...GmailProps.to, icon: 'send' },
    subject: { ...GmailProps.subject, icon: 'type' },
    content: Property.ShortText({
      displayName: 'Body',
      description: 'Only emails with this text in the body.',
      placeholder: 'order confirmed',
      icon: 'text',
      required: false,
    }),
    has_attachment: Property.Checkbox({
      displayName: 'Has Attachment',
      description: 'Only emails with at least one attachment.',
      icon: 'paperclip',
      required: false,
      defaultValue: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Only emails with an attachment of this file name.',
      placeholder: 'invoice.pdf',
      icon: 'file',
      required: false,
    }),
    label: GmailProps.label({ required: false, icon: 'tag' }),
    category: { ...GmailProps.category, icon: 'inbox' },
    after_date: Property.DateTime({
      displayName: 'After',
      description: 'Only emails received after this date.',
      icon: 'calendar',
      required: false,
    }),
    before_date: Property.DateTime({
      displayName: 'Before',
      description: 'Only emails received before this date.',
      icon: 'calendar',
      required: false,
    }),
    include_spam_trash: Property.Checkbox({
      displayName: 'Spam and Trash',
      description: 'Also search the Spam and Trash folders.',
      icon: 'trash',
      required: false,
      defaultValue: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Newest first, up to 500.',
      display: 'stepper',
      min: 1,
      max: 500,
      step: 1,
      required: false,
      defaultValue: 10,
    }),
  },
  outputSchema: gmailSearchMailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const queryParts: string[] = [];

    if (context.propsValue.from?.trim()) {
      queryParts.push(`from:(${context.propsValue.from.trim()})`);
    }
    if (context.propsValue.to?.trim()) {
      queryParts.push(`to:(${context.propsValue.to.trim()})`);
    }
    if (context.propsValue.subject?.trim()) {
      queryParts.push(`subject:(${context.propsValue.subject.trim()})`);
    }
    if (context.propsValue.content?.trim()) {
      queryParts.push(`"${context.propsValue.content.trim()}"`);
    }

    if (context.propsValue.has_attachment) {
      queryParts.push('has:attachment');
    }
    if (context.propsValue.attachment_name?.trim()) {
      queryParts.push(
        `filename:(${context.propsValue.attachment_name.trim()})`
      );
    }

    if (context.propsValue.label) {
      const label = context.propsValue.label;
      queryParts.push(`label:${label.name}`);
    }
    if (context.propsValue.category?.trim()) {
      queryParts.push(`category:${context.propsValue.category.trim()}`);
    }

    if (context.propsValue.after_date) {
      const afterDate = new Date(context.propsValue.after_date);
      const afterDateStr = afterDate
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '/');
      queryParts.push(`after:${afterDateStr}`);
    }
    if (context.propsValue.before_date) {
      const beforeDate = new Date(context.propsValue.before_date);
      const beforeDateStr = beforeDate
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '/');
      queryParts.push(`before:${beforeDateStr}`);
    }

    const searchQuery = queryParts.join(' ');

    const maxResults = Math.min(
      Math.max(context.propsValue.max_results || 10, 1),
      500
    );

    try {
      const searchResponse = await gmail.users.messages.list({
        userId: 'me',
        ...(searchQuery.trim() ? { q: searchQuery } : {}),
        maxResults: maxResults,
        includeSpamTrash: context.propsValue.include_spam_trash,
      });

      const messages = searchResponse.data.messages || [];

      if (messages.length === 0) {
        return {
          found: false,
          results: {
            messages: [],
            count: 0,
          },
        };
      }

      const detailedMessages = await Promise.all(
        messages.map(async (message) => {
          try {
            const rawMailResponse = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
              format: 'raw',
            });

            const parsedMailResponse = await parseStream(
              Buffer.from(
                rawMailResponse.data.raw as string,
                'base64'
              ).toString('utf-8')
            );

            return {
              id: message.id,
              ...parsedMailResponse,
              attachments: await convertAttachment(
                parsedMailResponse.attachments,
                context.files
              ),
            };
          } catch (error) {
            console.error(
              `Failed to get details for message ${message.id}:`,
              error
            );
            return {
              id: message.id,
              threadId: message.threadId,
              error: 'Failed to retrieve message details',
            };
          }
        })
      );

      return {
        found: true,
        results: {
          messages: detailedMessages,
          count: detailedMessages.length,
        },
      };
    } catch (error: any) {
      // Enhanced error handling
      if (error.code === 400) {
        if (error.message?.includes('Invalid query')) {
          throw new Error(
            `Invalid search query: "${searchQuery}". Please check your search syntax.`
          );
        }
        throw new Error(`Invalid search request: ${error.message}`);
      } else if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to search emails. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }

      throw new Error(`Failed to search emails: ${error.message}`);
    }
  },
});
