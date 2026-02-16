import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { getFirstFiveOrAll } from '../common/data';

const TRIGGER_KEY = 'starred_message_ids';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (checks within the last 2 days).',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['STARRED'],
      maxResults: 100,
    });

    const messageIds = (response.data.messages || []).map((m) => m.id);
    await context.store.put(TRIGGER_KEY, JSON.stringify(messageIds));
  },
  async onDisable(context) {
    await context.store.delete(TRIGGER_KEY);
  },
  async test(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['STARRED'],
      maxResults: 5,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return [];
    }

    const messages = await Promise.all(
      response.data.messages.map(async (m) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        });
        return detail.data;
      })
    );

    return getFirstFiveOrAll(messages);
  },
  async run(context) {
    const existingIds = (await context.store.get<string>(TRIGGER_KEY)) ?? '[]';
    const parsedExistingIds = JSON.parse(existingIds) as string[];

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Get starred messages from the last 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const afterDate = twoDaysAgo.toISOString().split('T')[0].replace(/-/g, '/');

    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['STARRED'],
      q: `after:${afterDate}`,
      maxResults: 100,
    });

    const currentMessages = response.data.messages || [];
    const allCurrentIds = currentMessages.map((m) => m.id);

    // Find newly starred messages
    const newMessages = currentMessages.filter(
      (m) => m.id && !parsedExistingIds.includes(m.id)
    );

    // Update stored IDs
    await context.store.put(TRIGGER_KEY, JSON.stringify(allCurrentIds));

    if (newMessages.length === 0) {
      return [];
    }

    // Fetch details for new starred messages
    const detailedMessages = await Promise.all(
      newMessages.map(async (m) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'To', 'Date'],
        });
        return detail.data;
      })
    );

    return detailedMessages;
  },
});
