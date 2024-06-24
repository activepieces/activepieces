import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  FilesService,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';

import dayjs from 'dayjs';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Attachment, ParsedMail, simpleParser } from 'mailparser';

export const testTrigger = createTrigger({
  auth: gmailAuth,
  name: 'test',
  displayName: 'Test',
  description: 'Triggers when new mail is found in your Gmail inbox',
  props: {
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category,
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

    const items = await pollRecentMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
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

    const items = await pollRecentMessages({
      auth: context.auth,
      props: context.propsValue,
      files: context.files,
      lastFetchEpochMS: lastFetchEpochMS,
    });

    return getFirstFiveOrAll(items.map((item) => item.data));
  },
});

interface PropsValue {
  from: string | undefined;
  to: string | undefined;
  label: GmailLabel | undefined;
  category: string | undefined;
}
async function getEmail(
  max_result: number,
  after_unix_seconds: number,
  { from, to, label, category }: PropsValue,
  auth: OAuth2PropertyValue,
  files: FilesService
) {
  return (
    (
      await GmailRequests.searchMail({
        max_results: max_result,
        access_token: auth.access_token,
        from: from as string,
        to: to as string,
        subject: undefined,
        label: label as GmailLabel,
        category: category as string,
        after: after_unix_seconds,
      })
    )?.messages ?? []
  );
}

async function listMessages({
  auth,
  queryString,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  queryString: string;
}) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  return gmail.users.messages.list({ userId: 'me', q: queryString });
}

async function getMessage({
  auth,
  messageId,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  messageId: string;
}) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  return gmail.users.messages.get({ userId: 'me', id: messageId });
}

async function getThread({
  auth,
  threadId,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  threadId: string;
}) {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  return gmail.users.threads.get({ userId: 'me', id: threadId });
}

async function parseStream(stream: any) {
  return new Promise<ParsedMail>((resolve, reject) => {
    simpleParser(stream, (err, parsed) => {
      if (err) {
        reject(err);
      } else {
        resolve(parsed);
      }
    });
  });
}

async function convertAttachment(
  attachments: Attachment[],
  files: FilesService
) {
  const promises = attachments.map(async (attachment) => {
    return files.write({
      fileName: attachment.filename ?? `attachment-${Date.now()}`,
      data: attachment.content,
    });
  });
  return Promise.all(promises);
}

async function pollRecentMessages({
  auth,
  props,
  files,
  lastFetchEpochMS,
}: {
  auth: PiecePropValueSchema<typeof gmailAuth>;
  props: PropsValue;
  files: FilesService;
  lastFetchEpochMS: number;
}): Promise<
  {
    epochMilliSeconds: number;
    data: unknown;
  }[]
> {
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);

  const gmail = google.gmail({ version: 'v1', auth: authClient });

  // construct query
  const query = [];
  const maxResults = lastFetchEpochMS === 0 ? 5 : 100;
  const afterUnixSeconds = Math.floor(lastFetchEpochMS / 1000);

  if (props.from) query.push(`from:(${props.from})`);
  if (props.to) query.push(`to:(${props.to})`);
  if (props.label) query.push(`label:${props.label.name}`);
  if (props.category) query.push(`category:${props.category}`);
  if (afterUnixSeconds != null && afterUnixSeconds > 0)
    query.push(`after:${afterUnixSeconds}`);

  // List Messages
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
        },
        thread: {
          ...threadResponse,
        },
        attachments: await convertAttachment(
          parsedMailResponse.attachments,
          files
        ),
      },
    });
  }

  return pollingResponse;
}

function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
