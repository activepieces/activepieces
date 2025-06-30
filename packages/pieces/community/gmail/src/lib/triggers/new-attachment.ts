import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment } from '../common/data';
import { GmailLabel } from '../common/models';

interface AttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

async function extractAttachmentInfo(gmail: any, messageId: string): Promise<AttachmentInfo[]> {
  const messageResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const message = messageResponse.data;
  const attachments: AttachmentInfo[] = [];

  function extractFromPart(part: any) {
    if (part.filename && part.body && part.body.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.parts) {
      part.parts.forEach(extractFromPart);
    }
  }

  if (message.payload) {
    extractFromPart(message.payload);
  }

  return attachments;
}

function matchesAttachmentFilters(
  attachments: AttachmentInfo[],
  filters: {
    filenameContains?: string;
    filenameExtension?: string;
    mimeTypeFilter?: string;
    minSizeKb?: number;
    maxSizeKb?: number;
  }
): boolean {
  if (attachments.length === 0) return false;

  return attachments.some(attachment => {
    if (filters.filenameContains) {
      const filename = attachment.filename.toLowerCase();
      const searchTerm = filters.filenameContains.toLowerCase();
      if (!filename.includes(searchTerm)) return false;
    }

    if (filters.filenameExtension) {
      const extension = attachment.filename.toLowerCase();
      const targetExtension = filters.filenameExtension.toLowerCase();
      if (!extension.endsWith(`.${targetExtension}`) && !extension.endsWith(targetExtension)) {
        return false;
      }
    }

    if (filters.mimeTypeFilter) {
      const mimeType = attachment.mimeType.toLowerCase();
      const targetMime = filters.mimeTypeFilter.toLowerCase();
      if (!mimeType.includes(targetMime)) return false;
    }

    if (filters.minSizeKb && attachment.size < filters.minSizeKb * 1024) return false;
    if (filters.maxSizeKb && attachment.size > filters.maxSizeKb * 1024) return false;

    return true;
  });
}

export const gmailNewAttachmentTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an email with an attachment arrives (with optional filters)',
  props: {
    from: {
      ...GmailProps.from,
      description: 'Filter by sender email (optional)',
      displayName: 'From',
      required: false,
    },
    to: {
      ...GmailProps.to,
      description: 'Filter by recipient email (optional)',
      displayName: 'To',
      required: false,
    },
    subject: Property.ShortText({
      displayName: 'Subject Contains',
      description: 'Only trigger for emails containing this text in the subject (optional)',
      required: false,
    }),
    label: {
      ...GmailProps.label,
      description: 'Filter by Gmail label (optional)',
      displayName: 'Label',
      required: false,
    },
    category: {
      ...GmailProps.category,
      description: 'Filter by Gmail category (optional)',
      displayName: 'Category',
      required: false,
    },
    filenameContains: Property.ShortText({
      displayName: 'Filename Contains',
      description: 'Only trigger for attachments with filenames containing this text (optional)',
      required: false,
    }),
    filenameExtension: Property.ShortText({
      displayName: 'File Extension',
      description: 'Only trigger for attachments with this file extension (e.g., pdf, jpg, docx)',
      required: false,
    }),
    mimeTypeFilter: Property.ShortText({
      displayName: 'MIME Type Filter',
      description: 'Only trigger for attachments with this MIME type (e.g., image/, application/pdf)',
      required: false,
    }),
    minSizeKb: Property.Number({
      displayName: 'Minimum Size (KB)',
      description: 'Only trigger for attachments larger than this size in KB (optional)',
      required: false,
    }),
    maxSizeKb: Property.Number({
      displayName: 'Maximum Size (KB)',
      description: 'Only trigger for attachments smaller than this size in KB (optional)',
      required: false,
    }),
    includeAttachmentContent: Property.Checkbox({
      displayName: 'Include Attachment Content',
      description: 'Download and include the actual attachment files in the trigger data',
      required: false,
      defaultValue: true,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Maximum Age (Hours)',
      description: 'Only trigger for emails received within this many hours',
      required: false,
      defaultValue: 24,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    await context.store.put('lastHistoryId', profile.data.historyId);
    await context.store.put('processedMessages', []);
  },
  onDisable: async (context) => {
    await context.store.delete('lastHistoryId');
    await context.store.delete('processedMessages');
  },
  run: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const lastHistoryId = await context.store.get('lastHistoryId');
    const processedMessages = (await context.store.get<string[]>('processedMessages')) || [];
    const maxAge = (context.propsValue.maxAgeHours || 24) * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId as string,
        historyTypes: ['messageAdded'],
        maxResults: 100,
      });

      const newMessageIds: string[] = [];
      
      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          if (history.messagesAdded) {
            for (const added of history.messagesAdded) {
              const messageId = added.message?.id;
              if (messageId && !processedMessages.includes(messageId)) {
                newMessageIds.push(messageId);
              }
            }
          }
        }
      }

      const results: any[] = [];
      
      for (const messageId of newMessageIds) {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
          });

          const message = messageResponse.data;
          const messageDate = parseInt(message.internalDate || '0');
          
          if (messageDate < cutoffTime) {
            processedMessages.push(messageId);
            continue;
          }

          const headers = message.payload?.headers || [];
          const headerMap: { [key: string]: string } = {};
          headers.forEach((h: any) => {
            if (h.name && h.value) {
              headerMap[h.name.toLowerCase()] = h.value;
            }
          });

          let shouldInclude = true;

          if (context.propsValue.from) {
            const from = headerMap['from'] || '';
            if (!from.toLowerCase().includes(context.propsValue.from.toLowerCase())) {
              shouldInclude = false;
            }
          }

          if (shouldInclude && context.propsValue.to) {
            const to = headerMap['to'] || '';
            if (!to.toLowerCase().includes(context.propsValue.to.toLowerCase())) {
              shouldInclude = false;
            }
          }

          if (shouldInclude && context.propsValue.subject) {
            const subject = headerMap['subject'] || '';
            if (!subject.toLowerCase().includes(context.propsValue.subject.toLowerCase())) {
              shouldInclude = false;
            }
          }

          if (shouldInclude && context.propsValue.label) {
            const labelIds = message.labelIds || [];
            const targetLabel = context.propsValue.label as GmailLabel;
            if (!labelIds.includes(targetLabel.id)) {
              shouldInclude = false;
            }
          }

          if (shouldInclude && context.propsValue.category) {
            const labelIds = message.labelIds || [];
            const categoryLabel = `CATEGORY_${context.propsValue.category.toUpperCase()}`;
            if (!labelIds.includes(categoryLabel)) {
              shouldInclude = false;
            }
          }

          if (shouldInclude) {
            const attachmentInfo = await extractAttachmentInfo(gmail, messageId);
            
            if (attachmentInfo.length > 0) {
              const attachmentFilters = {
                filenameContains: context.propsValue.filenameContains,
                filenameExtension: context.propsValue.filenameExtension,
                mimeTypeFilter: context.propsValue.mimeTypeFilter,
                minSizeKb: context.propsValue.minSizeKb,
                maxSizeKb: context.propsValue.maxSizeKb,
              };

              if (matchesAttachmentFilters(attachmentInfo, attachmentFilters)) {
                const rawResponse = await gmail.users.messages.get({
                  userId: 'me',
                  id: messageId,
                  format: 'raw',
                });

                const parsedMessage = await parseStream(
                  Buffer.from(rawResponse.data.raw as string, 'base64').toString('utf-8')
                );

                let processedAttachments = [];
                if (context.propsValue.includeAttachmentContent) {
                  processedAttachments = await convertAttachment(
                    parsedMessage.attachments,
                    context.files
                  );
                } else {
                  processedAttachments = attachmentInfo.map(att => ({
                    filename: att.filename,
                    mimeType: att.mimeType,
                    size: att.size,
                    sizeFormatted: formatFileSize(att.size),
                    attachmentId: att.attachmentId,
                    contentIncluded: false,
                  }));
                }

                results.push({
                  id: `attachment_email_${messageId}`,
                  data: {
                    message: {
                      ...parsedMessage,
                      id: messageId,
                      threadId: message.threadId,
                      date: new Date(messageDate).toISOString(),
                      attachments: processedAttachments,
                      labelIds: message.labelIds,
                    },
                    attachmentInfo: {
                      count: attachmentInfo.length,
                      totalSize: attachmentInfo.reduce((sum, att) => sum + att.size, 0),
                      totalSizeFormatted: formatFileSize(
                        attachmentInfo.reduce((sum, att) => sum + att.size, 0)
                      ),
                      attachments: attachmentInfo.map(att => ({
                        filename: att.filename,
                        mimeType: att.mimeType,
                        size: att.size,
                        sizeFormatted: formatFileSize(att.size),
                        extension: getFileExtension(att.filename),
                      })),
                    },
                    emailInfo: {
                      from: headerMap['from'],
                      to: headerMap['to'],
                      cc: headerMap['cc'],
                      subject: headerMap['subject'],
                      date: headerMap['date'],
                      snippet: message.snippet,
                    },
                    triggerInfo: {
                      type: 'new_attachment',
                      detectedAt: new Date().toISOString(),
                      filters: {
                        fromFilter: context.propsValue.from,
                        toFilter: context.propsValue.to,
                        subjectFilter: context.propsValue.subject,
                        labelFilter: context.propsValue.label,
                        categoryFilter: context.propsValue.category,
                        attachmentFilters: attachmentFilters,
                        maxAgeHours: context.propsValue.maxAgeHours,
                        includeContent: context.propsValue.includeAttachmentContent,
                      },
                    },
                  },
                });
              }
            }
          }

          processedMessages.push(messageId);
        } catch (error) {
          console.error(`Failed to process message ${messageId}:`, error);
          processedMessages.push(messageId); // Mark as processed to avoid reprocessing
        }
      }

      if (historyResponse.data.historyId) {
        await context.store.put('lastHistoryId', historyResponse.data.historyId);
      }
      
      const recentMessages = processedMessages.slice(-2000);
      await context.store.put('processedMessages', recentMessages);

      return results;
    } catch (error: any) {
      if (error.code === 404) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put('lastHistoryId', profile.data.historyId);
        return [];
      }
      throw error;
    }
  },
  test: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const maxAge = (context.propsValue.maxAgeHours || 24) * 60 * 60 * 1000;
    const cutoffSeconds = Math.floor((Date.now() - maxAge) / 1000);

    let query = `has:attachment after:${cutoffSeconds}`;
    
    if (context.propsValue.from) {
      query += ` from:(${context.propsValue.from})`;
    }
    if (context.propsValue.to) {
      query += ` to:(${context.propsValue.to})`;
    }
    if (context.propsValue.subject) {
      query += ` subject:(${context.propsValue.subject})`;
    }
    if (context.propsValue.label) {
      const label = context.propsValue.label as GmailLabel;
      query += ` label:${label.name}`;
    }
    if (context.propsValue.category) {
      query += ` category:${context.propsValue.category}`;
    }

    if (context.propsValue.filenameExtension) {
      query += ` filename:${context.propsValue.filenameExtension}`;
    }

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5,
    });

    const results: any[] = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const messageId = message.id!;
        
        try {
          const attachmentInfo = await extractAttachmentInfo(gmail, messageId);
          
          if (attachmentInfo.length > 0) {
            const attachmentFilters = {
              filenameContains: context.propsValue.filenameContains,
              filenameExtension: context.propsValue.filenameExtension,
              mimeTypeFilter: context.propsValue.mimeTypeFilter,
              minSizeKb: context.propsValue.minSizeKb,
              maxSizeKb: context.propsValue.maxSizeKb,
            };

            if (matchesAttachmentFilters(attachmentInfo, attachmentFilters)) {
              const messageResponse = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full',
              });

              const fullMessage = messageResponse.data;
              const headers = fullMessage.payload?.headers || [];
              const headerMap: { [key: string]: string } = {};
              headers.forEach((h: any) => {
                if (h.name && h.value) {
                  headerMap[h.name.toLowerCase()] = h.value;
                }
              });

              const rawResponse = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'raw',
              });

              const parsedMessage = await parseStream(
                Buffer.from(rawResponse.data.raw as string, 'base64').toString('utf-8')
              );

              let processedAttachments = [];
              if (context.propsValue.includeAttachmentContent) {
                processedAttachments = await convertAttachment(
                  parsedMessage.attachments,
                  context.files
                );
              } else {
                processedAttachments = attachmentInfo.map(att => ({
                  filename: att.filename,
                  mimeType: att.mimeType,
                  size: att.size,
                  sizeFormatted: formatFileSize(att.size),
                  attachmentId: att.attachmentId,
                  contentIncluded: false,
                }));
              }

              results.push({
                id: `test_attachment_email_${messageId}`,
                data: {
                  message: {
                    ...parsedMessage,
                    id: messageId,
                    threadId: fullMessage.threadId,
                    date: new Date(parseInt(fullMessage.internalDate || '0')).toISOString(),
                    attachments: processedAttachments,
                    labelIds: fullMessage.labelIds,
                  },
                  attachmentInfo: {
                    count: attachmentInfo.length,
                    totalSize: attachmentInfo.reduce((sum, att) => sum + att.size, 0),
                    totalSizeFormatted: formatFileSize(
                      attachmentInfo.reduce((sum, att) => sum + att.size, 0)
                    ),
                    attachments: attachmentInfo.map(att => ({
                      filename: att.filename,
                      mimeType: att.mimeType,
                      size: att.size,
                      sizeFormatted: formatFileSize(att.size),
                      extension: getFileExtension(att.filename),
                    })),
                  },
                  emailInfo: {
                    from: headerMap['from'],
                    to: headerMap['to'],
                    cc: headerMap['cc'],
                    subject: headerMap['subject'],
                    date: headerMap['date'],
                    snippet: fullMessage.snippet,
                  },
                  triggerInfo: {
                    type: 'new_attachment',
                    detectedAt: new Date().toISOString(),
                    testMode: true,
                    filters: {
                      fromFilter: context.propsValue.from,
                      toFilter: context.propsValue.to,
                      subjectFilter: context.propsValue.subject,
                      labelFilter: context.propsValue.label,
                      categoryFilter: context.propsValue.category,
                      attachmentFilters: {
                        filenameContains: context.propsValue.filenameContains,
                        filenameExtension: context.propsValue.filenameExtension,
                        mimeTypeFilter: context.propsValue.mimeTypeFilter,
                        minSizeKb: context.propsValue.minSizeKb,
                        maxSizeKb: context.propsValue.maxSizeKb,
                      },
                      maxAgeHours: context.propsValue.maxAgeHours,
                      includeContent: context.propsValue.includeAttachmentContent,
                    },
                  },
                },
              });
            }
          }
        } catch (error) {
          console.error(`Failed to process message ${messageId} in test:`, error);
        }
      }
    }

    return results;
  },
});

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
} 