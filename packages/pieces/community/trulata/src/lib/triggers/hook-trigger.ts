import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataAuth } from '../auth';
import { trulataRequest } from '../common';

// TruLata REST hooks: POST /v1/hooks subscribes a URL to one event, DELETE /v1/hooks/{id} removes it.
// Each delivery is { event, account, data, ...data } and arrives within about two minutes.
export const hookTrigger = (opts: {
  name: string;
  event: string;
  displayName: string;
  description: string;
  sampleData: Record<string, unknown>;
}) =>
  createTrigger({
    auth: trulataAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    props: {},
    sampleData: opts.sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const res = await trulataRequest<{ id: string }>(
        context.auth.secret_text,
        HttpMethod.POST,
        '/hooks',
        { event: opts.event, target_url: context.webhookUrl }
      );
      await context.store.put(`trulata_${opts.name}`, res.id);
    },
    async onDisable(context) {
      const id = await context.store.get<string>(`trulata_${opts.name}`);
      if (id) {
        await trulataRequest(context.auth.secret_text, HttpMethod.DELETE, `/hooks/${encodeURIComponent(id)}`);
        await context.store.delete(`trulata_${opts.name}`);
      }
    },
    async run(context) {
      const body = context.payload.body as { data?: unknown };
      return [body?.data ?? body];
    },
  });
