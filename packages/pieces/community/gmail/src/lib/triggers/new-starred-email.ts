import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { getFirstFiveOrAll } from '../common/data';
import { newStarredEmailTriggerOutputSchema } from '../output-schemas';

const TRIGGER_KEY = 'starredHistoryId';
const PROCESSED_KEY = 'processedStarredMessages';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  classification: 'READ',
  displayName: 'New Starred Email',
  description: 'Fires when an email is starred (within 2 days).',
  aiMetadata: {
    description:
      'Polls Gmail history for messages that gained the STARRED label since the last poll. Each event represents one newly starred message not seen on a prior poll. Use this to react to messages the user flags as important. Returns the list of newly starred messages with their thread and label metadata.',
  },
  props: {
    maxAgeHours: Property.Number({
      displayName: 'Maximum Age (Hours)',
      description:
        'Only trigger for emails starred within this many hours (defaults to 48, matching the 2-day window).',
      required: false,
      defaultValue: 48,
    }),
  },
  outputSchema: newStarredEmailTriggerOutputSchema,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    await context.store.put(TRIGGER_KEY, profile.data.historyId);
    await context.store.put(PROCESSED_KEY, []);
  },
  async onDisable(context) {
    await context.store.delete(TRIGGER_KEY);
    await context.store.delete(PROCESSED_KEY);
  },
  async test(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const maxAge = (context.propsValue.maxAgeHours || 48) * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;

    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: profile.data.historyId,
        historyTypes: ['labelAdded'],
        maxResults: 20,
      });

      const starred: any[] = [];
      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          for (const added of history.labelsAdded || []) {
            if (
              added.labelIds?.includes('STARRED') &&
              added.message?.id
            ) {
              const message = await gmail.users.messages.get({
                userId: 'me',
                id: added.message.id,
                format: 'full',
              });
              starred.push({
                id: history.id,
                message: message.data,
              });
            }
          }
        }
      }

      const filtered = starred.filter((entry) => {
        const internalDate = parseInt(
          entry.message.internalDate || '0',
          10
        );
        return internalDate >= cutoffTime;
      });

      return getFirstFiveOrAll(filtered);
    } catch (error: any) {
      if (error.code === 404) {
        return [];
      }
      throw error;
    }
  },
  async run(context) {
    const lastHistoryId = (await context.store.get<string>(TRIGGER_KEY)) ?? '0';
    const processedMessages =
      (await context.store.get<string[]>(PROCESSED_KEY)) || [];

    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const maxAge = (context.propsValue.maxAgeHours || 48) * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId as string,
        historyTypes: ['labelAdded'],
        maxResults: 100,
      });

      const starred: any[] = [];

      if (historyResponse.data.history) {
        for (const history of historyResponse.data.history) {
          for (const added of history.labelsAdded || []) {
            const messageId = added.message?.id;
            if (
              added.labelIds?.includes('STARRED') &&
              messageId &&
              !processedMessages.includes(messageId)
            ) {
              const message = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full',
              });
              starred.push({
                id: history.id,
                message: message.data,
              });
              processedMessages.push(messageId);
            }
          }
        }
      }

      if (historyResponse.data.historyId) {
        await context.store.put(
          TRIGGER_KEY,
          historyResponse.data.historyId
        );
      }

      const filtered = starred.filter((entry) => {
        const internalDate = parseInt(
          entry.message.internalDate || '0',
          10
        );
        return internalDate >= cutoffTime;
      });

      const recentProcessed = processedMessages.slice(-1000);
      await context.store.put(PROCESSED_KEY, recentProcessed);

      if (filtered.length === 0) {
        return [];
      }

      return filtered;
    } catch (error: any) {
      if (error.code === 404) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        await context.store.put(TRIGGER_KEY, profile.data.historyId);
        return [];
      }
      throw error;
    }
  },
});
