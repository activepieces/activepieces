import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { convertAttachment, parseStream } from '../common/data';

const TRIGGER_KEY = 'starred_message_ids';

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

    const twoDaysAgo = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `is:starred after:${twoDaysAgo}`,
      maxResults: 100,
    });

    const existingIds = (response.data.messages || []).map((m) => m.id!);
    await context.store.put(TRIGGER_KEY, existingIds);
  },
  async onDisable(context) {
    await context.store.delete(TRIGGER_KEY);
  },
  async test(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const twoDaysAgo = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `is:starred after:${twoDaysAgo}`,
      maxResults: 5,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return [];
    }

    const results = [];
    for (const msg of response.data.messages.slice(0, 5)) {
      const rawResponse = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'raw',
      });

      const parsed = await parseStream(
        Buffer.from(rawResponse.data.raw as string, 'base64').toString('utf-8')
      );

      results.push({
        ...parsed,
        messageId: msg.id,
        threadId: msg.threadId,
        attachments: await convertAttachment(parsed.attachments, context.files),
      });
    }

    return results;
  },
  async run(context) {
    const knownIds = (await context.store.get<string[]>(TRIGGER_KEY)) || [];

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const twoDaysAgo = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `is:starred after:${twoDaysAgo}`,
      maxResults: 100,
    });

    const currentMessages = response.data.messages || [];
    const currentIds = currentMessages.map((m) => m.id!);

    const newMessages = currentMessages.filter(
      (m) => !knownIds.includes(m.id!)
    );

    await context.store.put(TRIGGER_KEY, currentIds);

    if (newMessages.length === 0) {
      return [];
    }

    const results = [];
    for (const msg of newMessages) {
      const rawResponse = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'raw',
      });

      const parsed = await parseStream(
        Buffer.from(rawResponse.data.raw as string, 'base64').toString('utf-8')
      );

      results.push({
        ...parsed,
        messageId: msg.id,
        threadId: msg.threadId,
        attachments: await convertAttachment(parsed.attachments, context.files),
      });
    }

    return results;
  },
});
