import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailRequests } from '../common/data';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailSearchMail = createAction({
  auth: gmailAuth,
  name: 'gmail_search_mail',
  description: 'Find emails in your Gmail account using advanced search criteria',
  displayName: 'Find Email',
  props: {
    query: Property.LongText({
      displayName: 'Search Query',
      description: 'Gmail search query (supports Gmail search operators like "from:example@gmail.com subject:important")',
      required: false,
    }),
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
    
    is_unread: Property.Checkbox({
      displayName: 'Is Unread',
      description: 'Only find unread emails',
      required: false,
      defaultValue: false,
    }),
    is_starred: Property.Checkbox({
      displayName: 'Is Starred',
      description: 'Only find starred emails',
      required: false,
      defaultValue: false,
    }),
    is_important: Property.Checkbox({
      displayName: 'Is Important',
      description: 'Only find important emails',
      required: false,
      defaultValue: false,
    }),
    
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
    
    larger_than: Property.ShortText({
      displayName: 'Larger Than',
      description: 'Find emails larger than specified size (e.g., "10M" for 10MB, "5K" for 5KB)',
      required: false,
    }),
    smaller_than: Property.ShortText({
      displayName: 'Smaller Than',
      description: 'Find emails smaller than specified size (e.g., "1M" for 1MB)',
      required: false,
    }),
    
    include_spam_trash: Property.Checkbox({
      displayName: 'Include Spam & Trash',
      description: 'Include emails from Spam and Trash folders in search results',
      required: false,
      defaultValue: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of emails to return (1-500)',
      required: false,
      defaultValue: 10,
    }),
    return_full_content: Property.Checkbox({
      displayName: 'Return Full Content',
      description: 'Return full email content including body and attachments (slower but more detailed)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const queryParts: string[] = [];

    if (context.propsValue.query?.trim()) {
      queryParts.push(context.propsValue.query.trim());
    } else {
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
        queryParts.push(`filename:(${context.propsValue.attachment_name.trim()})`);
      }

      if (context.propsValue.label) {
        const label = context.propsValue.label as GmailLabel;
        queryParts.push(`label:${label.name}`);
      }
      if (context.propsValue.category?.trim()) {
        queryParts.push(`category:${context.propsValue.category.trim()}`);
      }

      if (context.propsValue.is_unread) {
        queryParts.push('is:unread');
      }
      if (context.propsValue.is_starred) {
        queryParts.push('is:starred');
      }
      if (context.propsValue.is_important) {
        queryParts.push('is:important');
      }

      if (context.propsValue.after_date) {
        const afterDate = new Date(context.propsValue.after_date);
        const afterDateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/');
        queryParts.push(`after:${afterDateStr}`);
      }
      if (context.propsValue.before_date) {
        const beforeDate = new Date(context.propsValue.before_date);
        const beforeDateStr = beforeDate.toISOString().split('T')[0].replace(/-/g, '/');
        queryParts.push(`before:${beforeDateStr}`);
      }

      if (context.propsValue.larger_than?.trim()) {
        queryParts.push(`larger:${context.propsValue.larger_than.trim()}`);
      }
      if (context.propsValue.smaller_than?.trim()) {
        queryParts.push(`smaller:${context.propsValue.smaller_than.trim()}`);
      }
    }

    const searchQuery = queryParts.join(' ');
    
    if (!searchQuery.trim()) {
      throw new Error('Please provide at least one search criterion');
    }

    const maxResults = Math.min(Math.max(context.propsValue.max_results || 10, 1), 500);

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
          success: true,
          query: searchQuery,
          results: {
            messages: [],
            count: 0,
            resultSizeEstimate: searchResponse.data.resultSizeEstimate || 0,
          },
          searchCriteria: {
            query: searchQuery,
            maxResults: maxResults,
            includeSpamTrash: context.propsValue.include_spam_trash,
            returnFullContent: context.propsValue.return_full_content,
          },
          note: 'No emails found matching the search criteria',
        };
      }

      const detailedMessages = await Promise.all(
        messages.map(async (message) => {
          try {
            const format = context.propsValue.return_full_content ? 'full' : 'metadata';
            const metadataHeaders = ['Subject', 'From', 'To', 'Cc', 'Bcc', 'Date', 'Message-ID'];
            
            const messageResponse = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
              format: format,
              metadataHeaders: format === 'metadata' ? metadataHeaders : undefined,
            });

            const messageData = messageResponse.data;
            
            const headers = messageData.payload?.headers || [];
            const headerMap = headers.reduce((acc: { [key: string]: string }, header) => {
              if (header.name && header.value) {
                acc[header.name.toLowerCase()] = header.value;
              }
              return acc;
            }, {});

            const allLabelsResponse = await GmailRequests.getLabels(context.auth);
            const labelMap = allLabelsResponse.body.labels.reduce((acc: { [key: string]: string }, label) => {
              acc[label.id] = label.name;
              return acc;
            }, {});

            const labelNames = (messageData.labelIds || []).map(id => labelMap[id] || id);

            let bodyContent = '';
            let attachments: any[] = [];
            
            if (context.propsValue.return_full_content && messageData.payload) {
              const extractTextFromParts = (parts: any[]): string => {
                let text = '';
                for (const part of parts) {
                  if (part.mimeType === 'text/plain' && part.body?.data) {
                    text += Buffer.from(part.body.data, 'base64').toString('utf-8') + '\n';
                  } else if (part.mimeType === 'text/html' && part.body?.data && !text) {
                    text += Buffer.from(part.body.data, 'base64').toString('utf-8') + '\n';
                  } else if (part.parts) {
                    text += extractTextFromParts(part.parts);
                  }
                  
                  if (part.filename && part.body?.attachmentId) {
                    attachments.push({
                      filename: part.filename,
                      mimeType: part.mimeType,
                      size: part.body.size || 0,
                      attachmentId: part.body.attachmentId,
                    });
                  }
                }
                return text;
              };

              if (messageData.payload.parts) {
                bodyContent = extractTextFromParts(messageData.payload.parts);
              } else if (messageData.payload.body?.data) {
                bodyContent = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
              }
            }

            return {
              id: message.id,
              threadId: message.threadId,
              subject: headerMap['subject'] || '',
              from: headerMap['from'] || '',
              to: headerMap['to'] || '',
              cc: headerMap['cc'] || '',
              date: headerMap['date'] || '',
              snippet: messageData.snippet || '',
              labels: {
                ids: messageData.labelIds || [],
                names: labelNames,
              },
              sizeEstimate: messageData.sizeEstimate || 0,
              historyId: messageData.historyId,
              internalDate: messageData.internalDate,
              ...(context.propsValue.return_full_content && {
                bodyContent: bodyContent.trim(),
                attachments: attachments,
                mimeType: messageData.payload?.mimeType,
              }),
            };
          } catch (error) {
            console.error(`Failed to get details for message ${message.id}:`, error);
            return {
              id: message.id,
              threadId: message.threadId,
              error: 'Failed to retrieve message details',
            };
          }
        })
      );

      return {
        success: true,
        query: searchQuery,
        results: {
          messages: detailedMessages,
          count: detailedMessages.length,
          resultSizeEstimate: searchResponse.data.resultSizeEstimate || 0,
          nextPageToken: searchResponse.data.nextPageToken,
        },
        searchCriteria: {
          query: searchQuery,
          maxResults: maxResults,
          includeSpamTrash: context.propsValue.include_spam_trash,
          returnFullContent: context.propsValue.return_full_content,
        },
        performance: {
          searchTime: new Date().toISOString(),
          messagesProcessed: detailedMessages.length,
        },
      };
    } catch (error: any) {
      // Enhanced error handling
      if (error.code === 400) {
        if (error.message?.includes('Invalid query')) {
          throw new Error(`Invalid search query: "${searchQuery}". Please check your search syntax.`);
        }
        throw new Error(`Invalid search request: ${error.message}`);
      } else if (error.code === 403) {
        throw new Error('Insufficient permissions to search emails. Ensure the gmail.readonly scope is granted.');
      } else if (error.code === 429) {
        throw new Error('Gmail API rate limit exceeded. Please try again later.');
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }
      
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  },
});
