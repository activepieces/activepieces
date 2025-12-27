import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { gmailAuth } from '../../';
import { parseStream, convertAttachment } from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within 2 days)',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
    await context.store.put('knownStarredIds', JSON.stringify([]));
  },
  async onDisable(context) {
    return;
  },
  async run(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;
    const knownStarredIdsJson = (await context.store.get<string>('knownStarredIds')) ?? '[]';
    const knownStarredIds: string[] = JSON.parse(knownStarredIdsJson);

    const items = await pollStarredMessages({
      auth: context.auth,
      files: context.files,
      knownStarredIds,
    });

    const newStarredIds = items.map((item) => item.id);
    await context.store.put('lastPoll', Date.now());
    await context.store.put('knownStarredIds', JSON.stringify(newStarredIds));

    // Return only newly starred emails (not previously known)
    return items
      .filter((item) => !knownStarredIds.includes(item.id))
      .map((item) => item.data);
  },
  async test(context) {
    const items = await pollStarredMessages({
      auth: context.auth,
      files: context.files,
      knownStarredIds: [],
    });

    return items.slice(0, 5).map((item) => item.data);
  },
});

async function pollStarredMessages({
  auth,
  files,
  knownStarredIds,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  files: FilesService;
  knownStarredIds: string[];
}): Promise<{ id: string; epochMilliSeconds: number; data: unknown }[]> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  // Get starred emails from last 2 days
  const twoDaysAgo = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);

  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: `is:starred after:${twoDaysAgo}`,
    maxResults: 50,
  });

  const pollingResponse = [];
  for (const message of messagesResponse.data.messages || []) {
    const rawMailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'raw',
    });
    const threadResponse = await gmail.users.threads.get({
      userId: 'me',
      id: message.threadId!,
    });

    const parsedMailResponse = await parseStream(
      Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
    );

    pollingResponse.push({
      id: message.id!,
      epochMilliSeconds: dayjs(parsedMailResponse.date).valueOf(),
      data: {
        message: {
          ...parsedMailResponse,
          attachments: await convertAttachment(parsedMailResponse.attachments, files),
        },
        thread: { ...threadResponse },
      },
    });
  }

  return pollingResponse;
}
