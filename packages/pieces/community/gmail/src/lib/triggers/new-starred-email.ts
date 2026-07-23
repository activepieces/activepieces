import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import {
  parseStream,
  convertAttachment,
  getFirstFiveOrAll,
} from '../common/data';

const STORE_KEY = 'starred_message_ids';

async function fetchStarredMessages({
  auth,
  files,
}: {
  auth: GmailAuthValue;
  files: FilesService;
}) {
  const authClient = await createGoogleClient(auth);
  const gmail = googleGmail({ version: 'v1', auth: authClient });

  // Only look at emails starred within the last 2 days.
  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    q: 'label:starred newer_than:2d',
    maxResults: 50,
  });

  const messages = messagesResponse.data.messages || [];

  const results: { id: string; data: unknown }[] = [];
  for (const message of messages) {
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

    results.push({
      id: message.id!,
      data: {
        message: {
          ...parsedMailResponse,
          id: message.id,
          threadId: rawMailResponse.data.threadId,
          attachments: await convertAttachment(
            parsedMailResponse.attachments,
            files
          ),
        },
      },
    });
  }

  return results;
}

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred (within the last 2 days).',
  aiMetadata: {
    description:
      'Fires when an email is starred in the connected Gmail account, looking only at messages starred within the last two days. Each event represents one newly starred message with its parsed contents.',
  },
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const messages = await fetchStarredMessages({
      auth: context.auth,
      files: context.files,
    });
    await context.store.put(
      STORE_KEY,
      JSON.stringify(messages.map((m) => m.id))
    );
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async run(context) {
    const seenIds = new Set(
      JSON.parse((await context.store.get<string>(STORE_KEY)) ?? '[]') as string[]
    );

    const messages = await fetchStarredMessages({
      auth: context.auth,
      files: context.files,
    });

    const newMessages = messages.filter((m) => !seenIds.has(m.id));

    await context.store.put(
      STORE_KEY,
      JSON.stringify(messages.map((m) => m.id))
    );

    return newMessages.map((m) => m.data);
  },
  async test(context) {
    const messages = await fetchStarredMessages({
      auth: context.auth,
      files: context.files,
    });
    return getFirstFiveOrAll(messages.map((m) => m.data));
  },
});
