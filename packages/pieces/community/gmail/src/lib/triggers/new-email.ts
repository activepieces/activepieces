import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { GmailLabel } from '../common/models';
import { GmailProps } from '../common/props';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { parseRawMessage, convertAttachment } from '../common/data';
import { gmailMessagePoll } from '../common/message-poll';
import { gmail as googleGmail, gmail_v1 } from '@googleapis/gmail';
import { gmailNewEmailReceivedTriggerOutputSchema } from '../output-schemas';

export const gmailNewEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_email_received',
  classification: 'READ',
  displayName: 'New Email',
  description: 'Triggers when a new email matching the filters arrives.',
  aiMetadata: {
    description:
      'Fires when a new email arrives in the connected Gmail account, optionally narrowed by sender, recipient, subject, label, or category filters. Each event represents one newly received message with its parsed contents and thread.',
  },
  props: {
    subject: GmailProps.subject,
    from: GmailProps.from,
    to: { ...GmailProps.to, advanced: true },
    label: GmailProps.label({ required: false }),
    category: { ...GmailProps.category, advanced: true },
  },
  outputSchema: gmailNewEmailReceivedTriggerOutputSchema,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await gmailMessagePoll.enable({
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const gmail = await createGmail(context.auth);
    return gmailMessagePoll.poll({
      gmail,
      store: context.store,
      query: buildQuery(context.propsValue),
      labelId: context.propsValue.label?.id,
      toItems: (message) =>
        toEmailItems({ gmail, message, files: context.files }),
    });
  },
  async test(context) {
    const gmail = await createGmail(context.auth);
    return gmailMessagePoll.sample({
      gmail,
      query: buildQuery(context.propsValue),
      labelId: context.propsValue.label?.id,
      toItems: (message) =>
        toEmailItems({ gmail, message, files: context.files }),
    });
  },
});

async function createGmail(auth: GmailAuthValue): Promise<gmail_v1.Gmail> {
  const authClient = await createGoogleClient(auth);
  return googleGmail({ version: 'v1', auth: authClient });
}

function buildQuery(props: PropsValue): string[] {
  return [
    ...(props.from ? [`from:(${props.from})`] : []),
    ...(props.to ? [`to:(${props.to})`] : []),
    ...(props.subject ? [`subject:(${props.subject})`] : []),
    ...(props.category ? [`category:${props.category}`] : []),
  ];
}

async function toEmailItems({
  gmail,
  message,
  files,
}: {
  gmail: gmail_v1.Gmail;
  message: gmail_v1.Schema$Message;
  files: FilesService;
}): Promise<unknown[]> {
  const threadResponse = await gmail.users.threads.get({
    userId: 'me',
    id: message.threadId ?? '',
  });
  const parsedMail = await parseRawMessage(message.raw);
  return [
    {
      message: {
        id: message.id,
        ...parsedMail,
        attachments: await convertAttachment(parsedMail.attachments, files),
      },
      thread: {
        data: threadResponse.data,
      },
    },
  ];
}

interface PropsValue {
  from: string | undefined;
  to: string | undefined;
  subject: string | undefined;
  label: GmailLabel | undefined;
  category: string | undefined;
}
