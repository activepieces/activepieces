import {
  createTrigger,
  TriggerStrategy,
  FilesService,
} from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { parseStream, convertAttachment } from '../common/data';

const STARRED_LABEL = 'STARRED';

async function enrichStarredMessage({
  gmail,
  messageId,
  files,
}: {
  gmail: any;
  messageId: string;
  files: FilesService;
}) {
  const rawMailResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  const parsedMailResponse = await parseStream(
    Buffer.from(rawMailResponse.data.raw as string, 'base64').toString('utf-8')
  );

  return {
    id: messageId,
    ...parsedMailResponse,
    attachments: await convertAttachment(parsedMailResponse.attachments, files),
  };
}

export const gmailNewStarredEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_starred_email',
  displayName: 'New Starred Email',
  description: 'Triggers when an email is starred',
  aiMetadata: {
    description:
      'Fires when a message is starred in the connected Gmail account (the STARRED label is added to it). Each event represents one message that was just starred, with its parsed contents.',
  },
  props: {},
  outputSchema: {
    fields: [
      { key: 'id', label: 'Message ID' },
      { key: 'subject', label: 'Subject' },
      { key: 'from', label: 'From', value: 'from.text' },
      { key: 'to', label: 'To', value: 'to.text' },
      { key: 'date', label: 'Date', format: 'datetime' },
      { key: 'text', label: 'Text Body' },
      { key: 'html', label: 'HTML Body', format: 'html' },
      { key: 'messageId', label: 'Internet Message ID' },
    ],
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    await context.store.put('lastHistoryId', profile.data.historyId);
  },
  onDisable: async (context) => {
    await context.store.delete('lastHistoryId');
  },
  run: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const lastHistoryId = await context.store.get('lastHistoryId');

    const historyResponse = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: lastHistoryId as string,
      labelId: STARRED_LABEL,
      historyTypes: ['labelAdded'],
    });

    const starredMessages = new Map<string, string>();

    if (historyResponse.data.history) {
      for (const history of historyResponse.data.history) {
        if (history.labelsAdded) {
          for (const labelAdded of history.labelsAdded) {
            if (
              labelAdded.labelIds?.includes(STARRED_LABEL) &&
              labelAdded.message?.id
            ) {
              starredMessages.set(
                labelAdded.message.id,
                history.id?.toString() || ''
              );
            }
          }
        }
      }
    }

    const results = [];
    for (const [messageId, historyId] of starredMessages) {
      const enriched = await enrichStarredMessage({
        gmail,
        messageId,
        files: context.files,
      });

      if (lastHistoryId !== historyId) {
        results.push({
          id: historyId,
          data: enriched,
        });
      }
    }

    if (historyResponse.data.historyId) {
      await context.store.put('lastHistoryId', historyResponse.data.historyId);
    }

    return results;
  },
  test: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [STARRED_LABEL],
      maxResults: 5,
    });

    const results = [];
    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        if (!message.id) {
          continue;
        }
        const enriched = await enrichStarredMessage({
          gmail,
          messageId: message.id,
          files: context.files,
        });
        results.push({
          id: message.id,
          data: enriched,
        });
      }
    }

    return results;
  },
});
