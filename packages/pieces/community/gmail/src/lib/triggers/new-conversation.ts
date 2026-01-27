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

async function enrichNewConversation({
  gmail,
  threadId,
  files,
  conversationInfo,
}: {
  gmail: any;
  threadId: string;
  files: FilesService;
  conversationInfo: {
    createdAt: number;
    historyId: string;
  };
}) {
  const threadResponse = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const thread = threadResponse.data;
  const messages = thread.messages || [];

  const firstMessage = messages[0];
  if (!firstMessage?.id) {
    throw new Error('No messages found in thread');
  }

  const rawMessageResponse = await gmail.users.messages.get({
    userId: 'me',
    id: firstMessage.id,
    format: 'raw',
  });

  const parsedFirstMessage = await parseStream(
    Buffer.from(rawMessageResponse.data.raw as string, 'base64').toString(
      'utf-8'
    )
  );

  const headers = firstMessage.payload?.headers || [];
  const headerMap = headers.reduce(
    (acc: { [key: string]: string }, header: any) => {
      if (header.name && header.value) {
        acc[header.name.toLowerCase()] = header.value;
      }
      return acc;
    },
    {}
  );

  return {
    conversation: {
      threadId: threadId,
      messageCount: messages.length,
      snippet: thread.snippet || '',
      historyId: thread.historyId,
      participants: extractParticipants(messages),
      subject: headerMap['subject'] || '',
      starter: {
        from: headerMap['from'] || '',
        to: headerMap['to'] || '',
        cc: headerMap['cc'] || '',
        bcc: headerMap['bcc'] || '',
        date: headerMap['date'] || '',
        messageId: firstMessage.id,
      },
    },
    firstMessage: {
      ...parsedFirstMessage,
      messageId: firstMessage.id,
      attachments: await convertAttachment(
        parsedFirstMessage.attachments,
        files
      ),
    },
    conversationInfo: {
      ...conversationInfo,
      triggeredAt: Date.now(),
    },
  };
}

function extractParticipants(messages: any[]): {
  from: Set<string>;
  to: Set<string>;
  cc: Set<string>;
} {
  const participants = {
    from: new Set<string>(),
    to: new Set<string>(),
    cc: new Set<string>(),
  };

  messages.forEach((message) => {
    const headers = message.payload?.headers || [];
    headers.forEach((header: any) => {
      if (header.name && header.value) {
        const name = header.name.toLowerCase();
        const value = header.value;

        if (name === 'from') {
          participants.from.add(value);
        } else if (name === 'to') {
          value
            .split(',')
            .forEach((email: string) => participants.to.add(email.trim()));
        } else if (name === 'cc') {
          value
            .split(',')
            .forEach((email: string) => participants.cc.add(email.trim()));
        }
      }
    });
  });

  return {
    from: participants.from,
    to: participants.to,
    cc: participants.cc,
  };
}

export const gmailNewConversationTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers when a new email conversation (thread) begins',
  props: {
    from: {
      ...GmailProps.from,
      description: 'Filter by sender email (optional)',
      displayName: 'From',
      required: false,
    },
    subject: Property.ShortText({
      displayName: 'Subject Contains',
      description:
        'Only trigger for conversations containing this text in the subject (optional)',
      required: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Maximum Age (Hours)',
      description:
        'Only trigger for conversations started within this many hours',
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
    await context.store.put('processedThreads', []);
  },
  onDisable: async (context) => {
    await context.store.delete('lastHistoryId');
    await context.store.delete('processedThreads');
  },
  run: async (context) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const lastHistoryId = await context.store.get('lastHistoryId');
    const processedThreads =
      (await context.store.get<string[]>('processedThreads')) || [];
    const maxAge = (context.propsValue.maxAgeHours || 24) * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId as string,
        historyTypes: ['messageAdded'],
        maxResults: 100,
      });

      const newConversations: string[] = [];

      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          if (history.messagesAdded) {
            for (const added of history.messagesAdded) {
              const threadId = added.message?.threadId;
              if (threadId && !processedThreads.includes(threadId)) {
                const threadResponse = await gmail.users.threads.get({
                  userId: 'me',
                  id: threadId,
                  format: 'minimal',
                });

                if (threadResponse.data.messages?.length === 1) {
                  newConversations.push(threadId);
                }
              }
            }
          }
        }
      }

      const results: any[] = [];
      for (const threadId of newConversations) {
        const threadResponse = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        });

        const thread = threadResponse.data;
        const firstMessage = thread.messages?.[0];
        if (!firstMessage) continue;

        const messageDate = parseInt(firstMessage.internalDate || '0');
        if (messageDate < cutoffTime) continue;

        const headers = firstMessage.payload?.headers || [];
        const headerMap: { [key: string]: string } = {};
        headers.forEach((h: any) => {
          if (h.name && h.value) {
            headerMap[h.name.toLowerCase()] = h.value;
          }
        });

        if (context.propsValue.from) {
          const from = headerMap['from'] || '';
          if (
            !from.toLowerCase().includes(context.propsValue.from.toLowerCase())
          ) {
            continue;
          }
        }

        if (context.propsValue.subject) {
          const subject = headerMap['subject'] || '';
          if (
            !subject
              .toLowerCase()
              .includes(context.propsValue.subject.toLowerCase())
          ) {
            continue;
          }
        }

        const rawResponse = await gmail.users.messages.get({
          userId: 'me',
          id: firstMessage.id!,
          format: 'raw',
        });

        const parsedMessage = await parseStream(
          Buffer.from(rawResponse.data.raw as string, 'base64').toString(
            'utf-8'
          )
        );

        results.push({
          id: `conversation_${threadId}`,
          data: {
            thread: {
              id: threadId,
              snippet: thread.snippet,
              messageCount: 1,
            },
            message: {
              ...parsedMessage,
              id: firstMessage.id,
              threadId: threadId,
              date: new Date(messageDate).toISOString(),
              attachments: await convertAttachment(
                parsedMessage.attachments,
                context.files
              ),
            },
            conversation: {
              starter: {
                from: headerMap['from'],
                to: headerMap['to'],
                subject: headerMap['subject'],
                date: headerMap['date'],
              },
            },
          },
        });

        processedThreads.push(threadId);
      }

      if (historyResponse.data.historyId) {
        await context.store.put(
          'lastHistoryId',
          historyResponse.data.historyId
        );
      }

      const recentThreads = processedThreads.slice(-1000);
      await context.store.put('processedThreads', recentThreads);

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

    let query = `after:${cutoffSeconds}`;
    if (context.propsValue.from) {
      query += ` from:(${context.propsValue.from})`;
    }
    if (context.propsValue.subject) {
      query += ` subject:(${context.propsValue.subject})`;
    }

    const threadsResponse = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults: 5,
    });

    const results: any[] = [];
    if (threadsResponse.data.threads) {
      for (const thread of threadsResponse.data.threads) {
        const threadId = thread.id!;

        const fullThread = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        });

        if (fullThread.data.messages?.length === 1) {
          const firstMessage = fullThread.data.messages[0];
          const headers = firstMessage.payload?.headers || [];
          const headerMap: { [key: string]: string } = {};
          headers.forEach((h: any) => {
            if (h.name && h.value) {
              headerMap[h.name.toLowerCase()] = h.value;
            }
          });

          const rawResponse = await gmail.users.messages.get({
            userId: 'me',
            id: firstMessage.id!,
            format: 'raw',
          });

          const parsedMessage = await parseStream(
            Buffer.from(rawResponse.data.raw as string, 'base64').toString(
              'utf-8'
            )
          );

          results.push({
            id: `test_conversation_${threadId}`,
            data: {
              thread: {
                id: threadId,
                snippet: fullThread.data.snippet,
                messageCount: 1,
              },
              message: {
                ...parsedMessage,
                id: firstMessage.id,
                threadId: threadId,
                date: new Date(
                  parseInt(firstMessage.internalDate || '0')
                ).toISOString(),
                attachments: await convertAttachment(
                  parsedMessage.attachments,
                  context.files
                ),
              },
              conversation: {
                starter: {
                  from: headerMap['from'],
                  to: headerMap['to'],
                  subject: headerMap['subject'],
                  date: headerMap['date'],
                },
              },
            },
          });
        }
      }
    }

    return results;
  },
});
