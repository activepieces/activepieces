import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { convertAttachment, parseStream } from '../common/data';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailSearchMailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_search_mail',
  displayName: 'Find Email',
  description: 'Find emails using advanced search criteria.',
  props: {
    from: GmailProps.from,
    to: GmailProps.to,
    subject: GmailProps.subject,
    content: Property.ShortText({
      displayName: 'Email Content',
      description: 'Search for specific text within email body',
      required: false,
    }),
    has_attachment: Property.Checkbox({
      displayName: 'Has Attachment',
      description: 'Only find emails with attachments',
      required: false,
      defaultValue: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Search for emails with specific attachment filename',
      required: false,
    }),
    label: GmailProps.label,
    category: GmailProps.category,
    after_date: Property.DateTime({
      displayName: 'After Date',
      description: 'Find emails sent after this date',
      required: false,
    }),
    before_date: Property.DateTime({
      displayName: 'Before Date',
      description: 'Find emails sent before this date',
      required: false,
    }),

    include_spam_trash: Property.Checkbox({
      displayName: 'Include Spam & Trash',
      description:
        'Include emails from Spam and Trash folders in search results',
      required: false,
      defaultValue: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of emails to return (1-500)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

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
      const label = context.propsValue.label as GmailLabel;
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

    if (!searchQuery.trim()) {
      throw new Error('Please provide at least one search criterion');
    }

    const maxResults = Math.min(
      Math.max(context.propsValue.max_results || 10, 1),
      500
    );

    try {
      const searchResponse = await gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
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
