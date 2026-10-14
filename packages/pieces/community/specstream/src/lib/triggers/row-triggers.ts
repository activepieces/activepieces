import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { specstreamAuth } from '../auth';
import {
  ListRecord,
  specstreamApi,
  specstreamRows,
  specstreamWebhook,
} from '../common/client';

type Hook = { hook_id: string; secret: string };
type Delivery = { id: string; event: string; find_id: string; records?: ListRecord[] };

const STORE_KEY = 'specstream_webhook';

const sampleRow = {
  id: 'fnd_example:ent_example',
  list_id: 'fnd_example',
  list_link: 'https://specstream.ai/workspace/collections/fnd_example',
  position: 1,
  Business: 'Northside Roofing',
  Website: 'northsideroofing.com',
  Phone: '(614) 555-0142',
  source_url: 'https://northsideroofing.com/contact',
  checked_at: '2026-10-14T08:00:00Z',
};

// One flow run per row, so each row can become a sheet row, a CRM record or a message.
function rowTrigger({
  name,
  event,
  displayName,
  description,
  info,
}: {
  name: string;
  event: 'find.completed' | 'monitor.found';
  displayName: string;
  description: string;
  info: string;
}) {
  return createTrigger({
    auth: specstreamAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: {
      description: `${description} Each run receives one row as a flat object keyed by column label, with list_id, list_link, source_url and checked_at. Deliveries are signed by SpecStream and verified before the flow runs.`,
    },
    props: {
      info: Property.MarkDown({ value: info }),
    },
    sampleData: sampleRow,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const hook = await specstreamApi.call<Hook>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/v1/account/webhooks',
        body: { url: context.webhookUrl, events: [event] },
      });
      await context.store.put<Hook>(STORE_KEY, { hook_id: hook.hook_id, secret: hook.secret });
    },
    async onDisable(context) {
      const hook = await context.store.get<Hook>(STORE_KEY);
      if (!hook) return;
      await specstreamApi.call<unknown>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/v1/account/webhooks/${encodeURIComponent(hook.hook_id)}`,
      });
      await context.store.delete(STORE_KEY);
    },
    async test(context) {
      const rows = await specstreamRows.latest(context.auth.secret_text);
      return rows.length ? rows : [sampleRow];
    },
    async run(context) {
      const hook = await context.store.get<Hook>(STORE_KEY);
      const verified = specstreamWebhook.verify({
        headers: context.payload.headers,
        rawBody: context.payload.rawBody,
        secret: hook?.secret ?? '',
      });
      if (!verified) return [];
      const body = context.payload.body as Delivery;
      if (body?.event !== event || !body.find_id) return [];
      return (body.records ?? []).map((record) => specstreamRows.flatten(body.find_id, record));
    },
  });
}

export const newRowTrigger = rowTrigger({
  name: 'new_row_in_finished_list',
  event: 'find.completed',
  displayName: 'New Row in a Finished List',
  description: 'Triggers when a list you asked for finishes, once for every row.',
  info: 'Runs once for every row when any list on this SpecStream account finishes, including lists started by **Find a List**, in the workspace or by an agent.',
});

export const newWatchedRowTrigger = rowTrigger({
  name: 'new_row_in_watched_list',
  event: 'monitor.found',
  displayName: 'New or Changed Row in a Watched List',
  description: 'Triggers when a list you keep current finds new or changed rows, once for every row.',
  info: 'Turn on **Keep it current** for a list in the SpecStream workspace. This trigger then runs once for every new or changed row each time SpecStream checks it again.',
});
