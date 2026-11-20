import {
  createTrigger,
  TriggerStrategy,
  FilesService,
  tryCatch,
  isNil,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail, gmail_v1 } from '@googleapis/gmail';
import { parseRawMessage, convertAttachment } from '../common/data';
import { newLabeledEmailTriggerOutputSchema } from '../output-schemas';

export const gmailNewLabeledEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'new_labeled_email',
  classification: 'READ',
  displayName: 'New Labeled Email',
  description: 'Triggers when this label is added to an email.',
  aiMetadata: {
    description:
      'Fires when the specified label is applied to an email (either newly received with the label or labeled afterward). Each event represents one message that just gained that label, with its parsed contents and label info.',
  },
  props: {
    label: GmailProps.label({
      required: true,
      description: 'Emails that receive this label start the flow.',
    }),
  },
  outputSchema: newLabeledEmailTriggerOutputSchema,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    if (
      context.isRepublish &&
      !isNil(await context.store.get('lastHistoryId'))
    ) {
      return;
    }
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const profile = await gmail.users.getProfile({
      userId: 'me',
    });

    await context.store.put('lastHistoryId', profile.data.historyId);
  },
  onDisable: async (context) => {
    if (context.isRepublish) {
      return;
    }
    await context.store.delete('lastHistoryId');
  },
  run: async (context) => {
    const startedAt = Date.now();
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const labelId = context.propsValue.label.id;

    const lastHistoryId = await context.store.get<string>('lastHistoryId');

    const { data: listing, error } = await tryCatch(() =>
      listLabelHistory({ gmail, startHistoryId: lastHistoryId ?? '', labelId })
    );
    if (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      const profile = await gmail.users.getProfile({ userId: 'me' });
      await context.store.put('lastHistoryId', profile.data.historyId);
      return [];
    }

    const results = [];
    let resumeHistoryId = listing.historyId;
    for (const [index, entry] of listing.entries.entries()) {
      const previous = listing.entries[index - 1];
      const atRecordStart = !previous || previous.historyId !== entry.historyId;
      if (
        results.length > 0 &&
        atRecordStart &&
        Date.now() - startedAt > TIME_BUDGET_MS
      ) {
        resumeHistoryId = previous.historyId;
        break;
      }
      const { data: enrichedMessage, error: enrichError } = await tryCatch(() =>
        enrichGmailMessage({
          gmail,
          messageId: entry.messageId,
          files: context.files,
          arrivedWithLabel: entry.arrivedWithLabel,
          labelInfo: { labelId, labelName: context.propsValue.label.name },
        })
      );
      if (enrichError) {
        if (isNotFoundError(enrichError)) {
          continue;
        }
        throw enrichError;
      }
      results.push({ id: entry.messageId, data: enrichedMessage });
    }

    if (resumeHistoryId) {
      await context.store.put('lastHistoryId', resumeHistoryId);
    }
    return results;
  },
  test: async (context) => {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [context.propsValue.label.id],
      maxResults: 5,
    });

    const results = [];

    if (messagesResponse.data.messages) {
      for (const message of messagesResponse.data.messages) {
        const messageId = message.id;
        if (!messageId) {
          continue;
        }
        const enrichedMessage = await enrichGmailMessage({
          gmail,
          messageId: messageId,
          files: context.files,
          arrivedWithLabel: false,
          labelInfo: {
            labelId: context.propsValue.label.id,
            labelName: context.propsValue.label.name,
          },
        });

        results.push({
          id: messageId,
          data: enrichedMessage,
        });
      }
    }

    return results;
  },
});

async function enrichGmailMessage({
  gmail,
  messageId,
  files,
  arrivedWithLabel,
  labelInfo,
}: {
  gmail: gmail_v1.Gmail;
  messageId: string;
  files: FilesService;
  arrivedWithLabel: boolean;
  labelInfo: {
    labelId: string;
    labelName: string;
  };
}) {
  const rawMailResponse = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'raw',
  });

  const threadResponse = await gmail.users.threads.get({
    userId: 'me',
    id: rawMailResponse.data.threadId ?? '',
  });

  const parsedMailResponse = await parseRawMessage(rawMailResponse.data.raw);

  return {
    message: {
      id: messageId,
      ...parsedMailResponse,
      attachments: await convertAttachment(
        parsedMailResponse.attachments,
        files
      ),
    },
    thread: threadResponse.data,
    labelInfo: {
      ...labelInfo,
      addedAt: arrivedWithLabel
        ? Number(rawMailResponse.data.internalDate)
        : Date.now(),
    },
  };
}

async function listLabelHistory({
  gmail,
  startHistoryId,
  labelId,
}: {
  gmail: gmail_v1.Gmail;
  startHistoryId: string;
  labelId: string;
}): Promise<{ entries: LabelHistoryEntry[]; historyId: string | undefined }> {
  const entries = new Map<string, LabelHistoryEntry>();
  let historyId: string | undefined;
  let pageToken: string | undefined;
  do {
    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      labelId,
      historyTypes: ['labelAdded', 'messageAdded'],
      pageToken,
    });
    for (const record of response.data.history ?? []) {
      const recordId = record.id ?? '';
      if (recordId === startHistoryId) {
        continue;
      }
      const labelled = (record.labelsAdded ?? [])
        .filter((added) => added.labelIds?.includes(labelId))
        .map((added) => ({ message: added.message, arrivedWithLabel: false }));
      const arrived = (record.messagesAdded ?? [])
        .filter((added) => added.message?.labelIds?.includes(labelId))
        .map((added) => ({ message: added.message, arrivedWithLabel: true }));
      for (const { message, arrivedWithLabel } of [...labelled, ...arrived]) {
        if (message?.id && !entries.has(message.id)) {
          entries.set(message.id, {
            messageId: message.id,
            historyId: recordId,
            arrivedWithLabel,
          });
        }
      }
    }
    historyId = response.data.historyId ?? historyId;
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
  return { entries: [...entries.values()], historyId };
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    Number(error.code) === 404
  );
}

const TIME_BUDGET_MS = 40 * 1000;

type LabelHistoryEntry = {
  messageId: string;
  historyId: string;
  arrivedWithLabel: boolean;
};
