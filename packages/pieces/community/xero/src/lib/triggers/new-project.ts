import {
  AppConnectionValueForAuthProperty,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { TEST_ITEM_LIMIT, xeroPolling } from '../common/polling';
import { xeroSamples } from '../common/samples';
import { SEEN_ID_LIMIT, xeroTriggerState } from '../common/trigger-state';
import { xeroOutputSchemas } from '../output-schemas';

const triggerProps = {
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
  page_size: Property.Number({
    displayName: 'Page Size (1-500)',
    description: 'No longer used: the trigger reads projects 500 at a time.',
    required: false,
  }),
};

type ProjectProps = StaticPropsValue<typeof triggerProps>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof xeroAuth>, ProjectProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const projects = await listProjects({ accessToken: auth.access_token, propsValue, maxPages: MAX_PAGES, pageSize: SCAN_PAGE_SIZE });
    const now = Date.now();
    return projects.map((project) => ({ epochMilliSeconds: now, data: project }));
  },
};

export const xeroNewProject = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_project',
  classification: 'READ',
  displayName: 'New Project',
  description: 'Fires when a new project is created.',
  aiMetadata: {
    description:
      'Fires once per Xero Projects project created after the trigger is enabled (projects that already existed when it was enabled are skipped), optionally filtered by contact or state (INPROGRESS, CLOSED). Each item is one project with its name, contact, status, deadline and estimate.',
  },
  props: {
    tenant_id: triggerProps.tenant_id,
    contact_id: triggerProps.contact_id,
    states: triggerProps.states,
    page_size: triggerProps.page_size,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: xeroOutputSchemas.project,
  sampleData: xeroSamples.project,
  async onEnable(context) {
    const seenKey = seenKeyOf({ tenantId: context.propsValue.tenant_id });
    const keep = await xeroPolling.keepStateOnRepublish({ store: context.store, isRepublish: context.isRepublish, propsValue: context.propsValue });
    const alreadySeeded = keep && (await context.store.get<unknown>(seenKey)) !== null;
    if (!alreadySeeded) {
      const existing = await listProjects({ accessToken: context.auth.access_token, propsValue: context.propsValue, maxPages: MAX_PAGES, pageSize: SCAN_PAGE_SIZE });
      await xeroTriggerState.seedSeenIds({
        store: context.store,
        key: seenKey,
        ids: existing.flatMap((project) => {
          const id = projectIdOf({ record: project });
          return id ? [id] : [];
        }),
      });
    }
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    const projects = await listProjects({ accessToken: context.auth.access_token, propsValue: context.propsValue, maxPages: 1, pageSize: TEST_ITEM_LIMIT });
    return projects.slice(0, TEST_ITEM_LIMIT);
  },
  async run(context) {
    const items = xeroPolling.records({ items: await pollingHelper.poll(polling, context) });
    return xeroTriggerState.emitFirstSeen({
      store: context.store,
      key: seenKeyOf({ tenantId: context.propsValue.tenant_id }),
      items,
      idOf: (record) => projectIdOf({ record }),
    });
  },
});

async function listProjects({
  accessToken,
  propsValue,
  maxPages,
  pageSize,
}: {
  accessToken: string;
  propsValue: ProjectProps;
  maxPages: number;
  pageSize?: number;
}): Promise<Record<string, unknown>[]> {
  const size = pageSize ?? xeroPolling.pageSizeOf({ value: propsValue.page_size, fallback: 50, max: 500 });
  const contactId = xeroInput.trimmedOrUndefined({ value: propsValue.contact_id });
  const states = xeroPolling.stringList({ value: propsValue.states });
  const projects: Record<string, unknown>[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId: propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.projects}/Projects`,
      queryParams: {
        page: String(page),
        pageSize: String(size),
        ...(contactId ? { contactID: contactId } : {}),
        ...(states.length > 0 ? { states: states.join(',') } : {}),
      },
      operation: 'list projects',
    });
    const pageItems = xeroApi.recordsOf({ body, key: 'items' });
    projects.push(...pageItems);
    if (pageItems.length < size) break;
  }
  return projects;
}

function projectIdOf({ record }: { record: Record<string, unknown> }): string | undefined {
  return xeroPolling.idOf({ record, key: 'projectId' }) ?? xeroPolling.idOf({ record, key: 'ProjectID' });
}

function seenKeyOf({ tenantId }: { tenantId: string }): string {
  return `xero_project_seen_ids_${tenantId}`;
}

const SCAN_PAGE_SIZE = 500;
const MAX_PAGES = SEEN_ID_LIMIT / SCAN_PAGE_SIZE;
