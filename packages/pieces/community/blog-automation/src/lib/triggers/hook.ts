import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { baRequest, blogAutomationAuth, sampleArticle, verifySignature } from '../common';

const STORE_KEY = 'blog_automation_webhook';
type Stored = { id: number; secret: string };
type Delivery = { id: string; event: string; createdAt: string; data: Record<string, unknown> };

const header = (h: Record<string, string> | undefined, name: string): string | undefined => {
  for (const [k, v] of Object.entries(h || {})) if (k.toLowerCase() === name) return v;
  return undefined;
};

/** REST hook trigger: onEnable = POST /webhooks (id + secret in the store), onDisable = DELETE /webhooks/{id} (404 = already gone). */
export function hookTrigger(opts: { name: string; displayName: string; description: string; event: string; sample?: Record<string, unknown> }) {
  return createTrigger({
    auth: blogAutomationAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: { id: 'evt_123', event: opts.event, createdAt: '2026-11-06T09:00:12.000Z', data: { ...sampleArticle, ...(opts.sample || {}) } },
    async onEnable(context) {
      const hook = await baRequest<Stored>(context.auth, HttpMethod.POST, '/webhooks', { url: context.webhookUrl, events: [opts.event], name: `Activepieces – ${opts.displayName}` });
      await context.store.put<Stored>(STORE_KEY, { id: hook.id, secret: hook.secret });
    },
    async onDisable(context) {
      const hook = await context.store.get<Stored>(STORE_KEY);
      if (!hook) return;
      try { await baRequest(context.auth, HttpMethod.DELETE, `/webhooks/${hook.id}`); }
      catch (e) { if (!/\(404\)/.test((e as Error).message)) throw e; }
      await context.store.delete(STORE_KEY);
    },
    async test(context) {
      const r = await baRequest<{ data: Delivery[] }>(context.auth, HttpMethod.GET, '/webhooks/sample', undefined, { event: opts.event, limit: '3' });
      return r.data;
    },
    async run(context) {
      const p = context.payload;
      const hook = await context.store.get<Stored>(STORE_KEY);
      const raw = typeof p.rawBody === 'string' ? p.rawBody : Buffer.isBuffer(p.rawBody) ? (p.rawBody as Buffer).toString('utf8') : null;
      if (hook?.secret && raw !== null && !verifySignature(hook.secret, header(p.headers, 'x-ba-signature'), raw)) return [];
      const body = (typeof p.body === 'string' ? JSON.parse(p.body) : p.body) as Delivery;
      if (!body || body.event !== opts.event) return [];   // "ping" from "Test senden" or other events
      return [body];
    },
  });
}
