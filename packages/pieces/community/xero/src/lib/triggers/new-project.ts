import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { props } from '../common/props';

const polling: Polling<
  PiecePropValueSchema<typeof xeroAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const { access_token } = auth as any;
    const tenantId = propsValue?.['tenant_id'] as string;
    const pageSize = (propsValue?.['page_size'] as number) || 50;
    const contactId = propsValue?.['contact_id'] as string | undefined;
    const states = (propsValue?.['states'] as string[]) || [];

    const results: any[] = [];
    const maxPages = 5;
    for (let page = 1; page <= maxPages; page++) {
      const queryParams: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
      };
      if (contactId) queryParams['contactId'] = contactId;
      if (Array.isArray(states) && states.length > 0) {
        queryParams['states'] = states.join(',');
      }

      const resp = await httpClient.sendRequest<Record<string, any>>({
        method: HttpMethod.GET,
        url: 'https://api.xero.com/projects.xro/2.0/Projects',
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
          'Xero-Tenant-Id': tenantId,
        },
        queryParams,
      });

      if (resp.status !== 200) break;

      const items: any[] = resp.body?.items ?? [];
      for (const it of items) {
        results.push({ epochMilliSeconds: Date.now(), data: it });
      }

      if (items.length < pageSize) break;
    }

    return results;
  },
};

export const xeroNewProject = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_project',
  displayName: 'New Project',
  description: 'Fires when a new project is created.',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(false),
    states: Property.StaticMultiSelectDropdown({
      displayName: 'States (optional)',
      required: false,
      options: {
        options: [
          { label: 'INPROGRESS', value: 'INPROGRESS' },
          { label: 'CLOSED', value: 'CLOSED' },
        ],
      },
    }),
    page_size: Property.Number({ displayName: 'Page Size (1-500)', required: false }),
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context: any) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context: any) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context: any) {
    return await pollingHelper.test(polling, context);
  },
  async run(context: any) {
    const items = (await pollingHelper.poll(polling, context)) as any[];
    const tenantId = context.propsValue['tenant_id'];
    const seenKey = `xero_project_seen_ids_${tenantId}`;
    const seen: string[] = (await context.store.get(seenKey)) || [];

    const results: any[] = [];
    for (const it of items) {
      const id = it?.projectId ?? it?.ProjectID ?? it?.data?.projectId;
      const data = it?.data ?? it;
      const projectId = id as string | undefined;
      if (!projectId) continue;
      if (!seen.includes(projectId)) {
        results.push(data);
        seen.push(projectId);
      }
    }
    await context.store.put(seenKey, seen);
    return results;
  },
  sampleData: undefined,
});


