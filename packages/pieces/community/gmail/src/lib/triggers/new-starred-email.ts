import {
  createTrigger,
  TriggerStrategy,
  FilesService,
  Property,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment } from '../common/data';

async function enrichStarredMessage({
  gmail,
  messageId,
  files,
  starredInfo,
}: {
  gmail: any;
  messageId: string;
  files: FilesService;
  starredInfo: {
    starredAt: number;
    historyId: string;
  };
}) {
  const rawMailResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  const threadResponse = await gmail.users.threads.get({
    userId: 'me',
    id: rawMailResponse.data.threadId!,
  });

  const parsedMailResponse = await parseStream(
    Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
  );

  return {
    message: {
      ...parsedMailResponse,
      messageId: messageId,
      attachments: await convertAttachment(
        parsedMailResponse.attachments,
        files
      ),
    },
    thread: threadResponse.data,
    starredInfo: {
      ...starredInfo,
      triggeredAt: Date.now(),
    },
  };
}

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within the last 2 days)',
  props: {
    include_sender_filter: Property.Checkbox({
      displayName: 'Filter by Sender',
      description: 'Only trigger for starred emails from specific senders',
      required: false,
      defaultValue: false,
    }),
    from: {
      ...GmailProps.from,
      description: 'Only trigger for starred emails from this sender (leave empty to include all senders)',
      displayName: 'Sender Filter',
    },
    include_subject_filter: Property.Checkbox({
      displayName: 'Filter by Subject',
      description: 'Only trigger for starred emails with specific subject keywords',
      required: false,
      defaultValue: false,
    }),
    subject: {
      ...GmailProps.subject,
      description: 'Only trigger for starred emails containing this text in the subject',
      displayName: 'Subject Filter',
    },
    include_category_filter: Property.Checkbox({
      displayName: 'Filter by Category',
      description: 'Only trigger for starred emails in specific categories',
      required: false,
      defaultValue: false,
    }),
    category: {
      ...GmailProps.category,
      description: 'Only trigger for starred emails in this category',
      displayName: 'Category Filter',
    },
    max_age_hours: Property.Number({
      displayName: 'Maximum Age (Hours)',
      description: 'Only trigger for emails starred within this many hours (default: 48 hours = 2 days)',
      required: false,
      defaultValue: 48,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({
      userId: 'me',
    });

    await context.store.put('lastHistoryId', profile.data.historyId);
    await context.store.put('triggerEnabled', Date.now());
  },
  onDisable: async (context) => {
    await context.store.delete('lastHistoryId');
    await context.store.delete('triggerEnabled');
    await context.store.delete('processedStarredMessages');
  },
  run: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const lastHistoryId = await context.store.get('lastHistoryId');
    const processedMessagesArray = (await context.store.get<string[]>('processedStarredMessages')) || [];
    const processedMessages = new Set(processedMessagesArray);
    const maxAgeHours = context.propsValue.max_age_hours || 48;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId as string,
        historyTypes: ['labelAdded'],
        maxResults: 500,
      });

      const starredMessages = new Map<string, { historyId: string; timestamp: number }>();
      const results: any[] = [];

      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          if (history.labelsAdded) {
            for (const labelAdded of history.labelsAdded) {
              if (
                labelAdded.labelIds?.includes('STARRED') &&
                labelAdded.message?.id
              ) {
                const messageId = labelAdded.message.id;
                const historyTimestamp = parseInt(history.id || '0');
                
                if (!processedMessages.has(messageId)) {
                  starredMessages.set(messageId, {
                    historyId: history.id?.toString() || '',
                    timestamp: historyTimestamp,
                  });
                }
              }
            }
          }
        }
      }

      for (const [messageId, starInfo] of starredMessages) {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date'],
          });

          const messageData = messageResponse.data;
          const internalDate = parseInt(messageData.internalDate || '0');
          
          if (internalDate < cutoffTime) {
            continue;
          }

          const headers = messageData.payload?.headers || [];
          const headerMap = headers.reduce((acc: { [key: string]: string }, header) => {
            if (header.name && header.value) {
              acc[header.name.toLowerCase()] = header.value;
            }
            return acc;
          }, {});

          let shouldInclude = true;

          if (context.propsValue.include_sender_filter && context.propsValue.from?.trim()) {
            const fromHeader = headerMap['from'] || '';
            const senderFilter = context.propsValue.from.trim().toLowerCase();
            if (!fromHeader.toLowerCase().includes(senderFilter)) {
              shouldInclude = false;
            }
          }

          if (shouldInclude && context.propsValue.include_subject_filter && context.propsValue.subject?.trim()) {
            const subjectHeader = headerMap['subject'] || '';
            const subjectFilter = context.propsValue.subject.trim().toLowerCase();
            if (!subjectHeader.toLowerCase().includes(subjectFilter)) {
              shouldInclude = false;
            }
          }

          if (shouldInclude && context.propsValue.include_category_filter && context.propsValue.category?.trim()) {
            const labelIds = messageData.labelIds || [];
            const categoryLabel = `CATEGORY_${context.propsValue.category.toUpperCase()}`;
            if (!labelIds.includes(categoryLabel)) {
              shouldInclude = false;
            }
          }

          if (shouldInclude) {
            const enrichedMessage = await enrichStarredMessage({
              gmail,
              messageId,
              files: context.files,
              starredInfo: {
                starredAt: internalDate,
                historyId: starInfo.historyId,
              },
            });

            results.push({
              id: `starred_${messageId}_${starInfo.historyId}`,
              data: {
                ...enrichedMessage,
                triggerInfo: {
                  type: 'starred',
                  messageId: messageId,
                  starredAt: new Date(internalDate).toISOString(),
                  detectedAt: new Date().toISOString(),
                  historyId: starInfo.historyId,
                  filters: {
                    senderFilter: context.propsValue.include_sender_filter ? context.propsValue.from : null,
                    subjectFilter: context.propsValue.include_subject_filter ? context.propsValue.subject : null,
                    categoryFilter: context.propsValue.include_category_filter ? context.propsValue.category : null,
                    maxAgeHours: maxAgeHours,
                  },
                },
              },
            });

            processedMessages.add(messageId);
          }
        } catch (error) {
          console.error(`Failed to process starred message ${messageId}:`, error);
        }
      }

      if (historyResponse.data.historyId) {
        await context.store.put('lastHistoryId', historyResponse.data.historyId);
      }
      
      const recentProcessedMessages: string[] = [];
      for (const msgId of processedMessages) {
        try {
          const msgResponse = await gmail.users.messages.get({
            userId: 'me',
            id: msgId as string,
            format: 'minimal',
          });
          const msgDate = parseInt(msgResponse.data.internalDate || '0');
          if (msgDate >= cutoffTime) {
            recentProcessedMessages.push(msgId);
          }
        } catch {
          // Message might be deleted
        }
      }
      await context.store.put('processedStarredMessages', recentProcessedMessages);

      return results;
    } catch (error: any) {
      console.error('Error in starred email trigger:', error);
      
      if (error.code === 404 && error.message?.includes('historyId')) {
        const profile = await gmail.users.getProfile({
          userId: 'me',
        });
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

    const maxAgeHours = context.propsValue.max_age_hours || 48;
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const cutoffSeconds = Math.floor(cutoffTime / 1000);

    const queryParts = ['is:starred'];
    
    queryParts.push(`after:${cutoffSeconds}`);
    
    if (context.propsValue.include_sender_filter && context.propsValue.from?.trim()) {
      queryParts.push(`from:(${context.propsValue.from.trim()})`);
    }
    if (context.propsValue.include_subject_filter && context.propsValue.subject?.trim()) {
      queryParts.push(`subject:(${context.propsValue.subject.trim()})`);
    }
    if (context.propsValue.include_category_filter && context.propsValue.category?.trim()) {
      queryParts.push(`category:${context.propsValue.category.trim()}`);
    }

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: queryParts.join(' '),
      maxResults: 5,
    });

    const results: any[] = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const messageId = message.id;
        if (!messageId) {
          continue;
        }

        try {
          const enrichedMessage = await enrichStarredMessage({
            gmail,
            messageId: messageId,
            files: context.files,
            starredInfo: {
              starredAt: Date.now(),
              historyId: 'test',
            },
          });

          results.push({
            id: `test_starred_${messageId}`,
            data: {
              ...enrichedMessage,
              triggerInfo: {
                type: 'starred',
                messageId: messageId,
                starredAt: new Date().toISOString(),
                detectedAt: new Date().toISOString(),
                historyId: 'test',
                testMode: true,
                filters: {
                  senderFilter: context.propsValue.include_sender_filter ? context.propsValue.from : null,
                  subjectFilter: context.propsValue.include_subject_filter ? context.propsValue.subject : null,
                  categoryFilter: context.propsValue.include_category_filter ? context.propsValue.category : null,
                  maxAgeHours: maxAgeHours,
                },
              },
            },
          });
        } catch (error) {
          console.error(`Failed to process starred message ${messageId} in test:`, error);
        }
      }
    }

    return results;
  },
}); 