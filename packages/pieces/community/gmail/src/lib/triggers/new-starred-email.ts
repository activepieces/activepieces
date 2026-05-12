import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { google } from 'googleapis';
import {
  parseStream,
  convertAttachment,
  getFirstFiveOrAll,
} from '../common/data';
import { GmailLabel } from '../common/models';

type Props = {
  from?: string;
  to?: string;
  subject?: string;
  label?: GmailLabel;
};

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within the last 2 days).',
  props: {
    from: {
      ...GmailProps.from,
      description: 'Filter by sender email.',
      displayName: 'From',
      required: false,
    },
    to: {
      ...GmailProps.to,
      description: 'Filter by recipient email.',
      displayName: 'To',
      required: false,
    },
    subject: {
      ...GmailProps.subject,
      description: 'Filter by subject text.',
      displayName: 'Subject Contains',
      required: false,
    },
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastPoll', Date.now());
  },
  async onDisable() {
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
  auth: GmailAuthValue;
  props: Props;
  files: FilesService;
  lastFetchEpochMS: number;
}): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const authClient = await createGoogleClient(auth);
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const query = ['is:starred'];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 20;
  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);

  if (props.from) query.push(`from:(${props.from})`);
  if (props.to) query.push(`to:(${props.to})`);
  if (props.subject) query.push(`subject:(${props.subject})`);
  if (afterUnixSeconds > 0) query.push(`after:${afterUnixSeconds}`);

  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query.join(' '),
    maxResults,
  });

  const messages = (messagesResponse.data.messages || []).slice().reverse();

  const pollingResponse = [];
  for (const message of messages) {
    try {
      const rawMailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'raw',
      });

      const parsedMailResponse = await parseStream(
        Buffer.from(rawMailResponse.data.raw as string, 'base64').toString(
          'utf-8'
        )
      );

      pollingResponse.push({
        epochMilliSeconds: Number(rawMailResponse.data.internalDate),
        data: {
          message: {
            id: message.id,
            threadId: message.threadId,
            ...parsedMailResponse,
            attachments: await convertAttachment(
              parsedMailResponse.attachments,
              files
            ),
          },
        },
      });
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const isRateLimit =
        err.status === 429 ||
        (err.status === 403 && /quota|rate.?limit/i.test(err.message ?? ''));
      if (isRateLimit) {
        break;
      }
      throw error;
    }
  }

  return pollingResponse;
}
