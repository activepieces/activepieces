import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import {
  parseStream,
  convertAttachment,
  getFirstFiveOrAll,
} from '../common/data';
import dayjs from 'dayjs';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (checks emails within the last 2 days).',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    await context.store.put('lastHistoryId', profile.data.historyId);
  },
  async onDisable(context) {
    await context.store.delete('lastHistoryId');
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const lastHistoryId = await context.store.get<string>('lastHistoryId');
    if (!lastHistoryId) {
      return [];
    }

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId,
        historyTypes: ['labelAdded'],
      });

      const starredMessageIds = new Set<string>();

      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          if (history.labelsAdded) {
            for (const labelAdded of history.labelsAdded) {
              if (
                labelAdded.labelIds?.includes('STARRED') &&
                labelAdded.message?.id
              ) {
                starredMessageIds.add(labelAdded.message.id);
              }
            }
          }
        }
      }

      const results = [];
      // Only consider emails within the last 2 days
      const twoDaysAgo = dayjs().subtract(2, 'day').valueOf();

      for (const messageId of starredMessageIds) {
        const rawMailResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'raw',
        });

        const internalDate = parseInt(rawMailResponse.data.internalDate || '0');
        if (internalDate < twoDaysAgo) {
          continue;
        }

        const parsedMailResponse = await parseStream(
          Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
        );

        results.push({
          message: {
            id: messageId,
            threadId: rawMailResponse.data.threadId,
            ...parsedMailResponse,
            attachments: await convertAttachment(
              parsedMailResponse.attachments,
              context.files
            ),
          },
        });
      }

      if (historyResponse.data.historyId) {
        await context.store.put('lastHistoryId', historyResponse.data.historyId);
      }

      return results;
    } catch (error: any) {
      if (error.code === 404) {
        // History ID expired, reset
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put('lastHistoryId', profile.data.historyId);
        return [];
      }
      throw error;
    }
  },
  async test(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Get recent starred emails
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:starred',
      maxResults: 5,
    });

    const results = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const rawMailResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'raw',
        });

        const parsedMailResponse = await parseStream(
          Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
        );

        results.push({
          message: {
            id: message.id,
            threadId: message.threadId,
            ...parsedMailResponse,
            attachments: await convertAttachment(
              parsedMailResponse.attachments,
              context.files
            ),
          },
        });
      }
    }

    return getFirstFiveOrAll(results);
  },
});
