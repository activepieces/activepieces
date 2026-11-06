import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { claritiaAuth } from '../auth';
import { claritiaCall, HookBody, itemOf } from '../common';
import { formDropdown } from '../props';

const HOOK_KEY = '_claritia_hook';

/** A trigger on one Claritia event, as a REST hook: added on enable, removed on disable. */
export const hookTrigger = (o: { name: string; displayName: string; description: string; event: string; forms?: boolean }) =>
  createTrigger({
    auth: claritiaAuth,
    name: o.name,
    displayName: o.displayName,
    description: o.description,
    type: TriggerStrategy.WEBHOOK,
    props: o.forms ? { form: formDropdown } : {},
    sampleData: { id: '00000000-0000-0000-0000-000000000000', event: o.event, event_id: 'evt_test', test: true },
    async onEnable(context) {
      const form = (context.propsValue as { form?: string }).form;
      const r = await claritiaCall<{ id: string }>(context.auth, HttpMethod.POST, '/hooks', {
        url: context.webhookUrl,
        event: o.event,
        form: form || undefined,
        description: 'Activepieces',
      });
      await context.store.put<string>(HOOK_KEY, r.id);
    },
    async onDisable(context) {
      const id = await context.store.get<string>(HOOK_KEY);
      if (id) await claritiaCall(context.auth, HttpMethod.DELETE, `/hooks/${id}`);
    },
    async run(context) {
      return [itemOf(context.payload.body as HookBody)];
    },
    async test(context) {
      const form = (context.propsValue as { form?: string }).form ?? '';
      const r = await claritiaCall<{ items: object[] }>(context.auth, HttpMethod.GET, '/events', undefined, { event: o.event, form, limit: '3', sample: '1' });
      return r.items;
    },
  });
