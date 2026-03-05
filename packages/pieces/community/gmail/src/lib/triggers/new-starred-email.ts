import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../auth';
import {
  parseStream,
  convertAttachment,
  getFirstFiveOrAll,
} from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within 2 days)',
  props: {
    from: GmailProps.from,
    subject: GmailProps.subject,
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
  },
  async onDisable(context) {
    return;
  },
  async run(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;

    const items = await pollStarredMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS,
    });

    const newLastEpochMilliSeconds = items.reduce(
      (acc, item) => Math.max(acc, item.epochMilliSeconds),
      lastFetchEpochMS
    );
    await context.store.put('lastPoll', newLastEpochMilliSeconds);
    return items
      .filter((f) => f.epochMilliSeconds > lastFetchEpochMS)
      .map((item) => item.data);
  },
  async test(context) {
    const lastFetchEpochMS = (await context.store.get<number>('lastPoll')) ?? 0;

    const items = await pollStarredMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

async function pollStarredMessages({
  auth,
  props,
  files,
  lastFetchEpochMS,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  props: { from: string | undefined; subject: string | undefined };
  files: FilesService;
  lastFetchEpochMS: number;
}): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const query = ['is:starred'];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;

  // Only look back 2 days max
  const twoDaysAgo = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000);
  const afterUnixSeconds = Math.max(
    Math.floor(lastFetchEpochMS / 1000),
    twoDaysAgo
  );

  if (props.from) query.push(`from:(${props.from})`);
  if (props.subject) query.push(`subject:(${props.subject})`);
  if (afterUnixSeconds > 0) query.push(`after:${afterUnixSeconds}`);

  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query.join(' '),
    maxResults,
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
      Buffer.from(rawMailResponse.data.raw as string, 'base64').toString(
        'utf-8'
      )
    );

    pollingResponse.push({
      epochMilliSeconds: dayjs(parsedMailResponse.date).valueOf(),
      data: {
        message: {
          ...parsedMailResponse,
          attachments: await convertAttachment(
            parsedMailResponse.attachments,
            files
          ),
        },
        thread: {
          ...threadResponse,
        },
      },
    });
  }

  return pollingResponse;
}
