import {
  createTrigger,
  TriggerStrategy,
  tryCatch,
} from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import type {
  ParseurAuthValue,
  ParseurWebhookInformation,
} from '../common/types';

export const newDocumentNotProcessedTrigger = createTrigger({
  auth: parseurAuth,
  name: 'newDocumentNotProcessed',
  classification: 'READ',
  displayName: 'New Document Not Processed',
  description:
    'Fires when Parseur fails to parse a document (e.g. no matching template).',
  aiMetadata: {
    description:
      'Fires when Parseur receives a document but cannot parse it because no matching template exists (template-needed). Use to react to documents that require a new template or manual attention. The mailbox filter is optional; without it, the event fires across mailboxes.',
  },
  props: {
    mailboxId: parseurProps.parserId({ required: false }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await parseurApi.createWebhook({
      auth: context.auth,
      event: 'document.template_needed',
      target: context.webhookUrl,
    });
    const { error } = await tryCatch(() =>
      enableOnMailboxes({
        auth: context.auth,
        webhookId: webhook.id,
        mailboxId: context.propsValue.mailboxId,
      })
    );
    if (error) {
      await parseurApi.deleteWebhook({
        auth: context.auth,
        webhookId: webhook.id,
      });
      throw error;
    }
    await context.store.put<ParseurWebhookInformation>('_newDocumentNotProcessed', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<ParseurWebhookInformation>(
      '_newDocumentNotProcessed'
    );
    if (!webhookInfo) {
      return;
    }
    await parseurApi.deleteWebhook({
      auth: context.auth,
      webhookId: webhookInfo.webhookId,
    });
    await context.store.delete('_newDocumentNotProcessed');
  },
  async run(context) {
    return [context.payload.body];
  },
});

async function enableOnMailboxes({
  auth,
  webhookId,
  mailboxId,
}: {
  auth: ParseurAuthValue;
  webhookId: number;
  mailboxId: number | undefined;
}): Promise<void> {
  const mailboxIds =
    mailboxId === undefined ? await listAllMailboxIds({ auth }) : [mailboxId];
  for (const id of mailboxIds) {
    await parseurApi.enableWebhook({ auth, webhookId, mailboxId: id });
  }
}

async function listAllMailboxIds({
  auth,
}: {
  auth: ParseurAuthValue;
}): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await parseurApi.listMailboxes({
      auth,
      query: { page: String(page), page_size: String(PAGE_SIZE) },
    });
    ids.push(...response.results.map((mailbox) => mailbox.id));
    if (response.current >= response.total) {
      break;
    }
  }
  return ids;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
