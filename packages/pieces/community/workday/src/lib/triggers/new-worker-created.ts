import { createTrigger, OAuth2PropertyValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

type WorkerData = {
  id: string;
  workerId: string;
  descriptor: string;
  [key: string]: unknown;
};

type WorkersResponse = {
  data: WorkerData[];
  total: number;
};

async function fetchAllWorkers(hostname: string, tenant: string, accessToken: string): Promise<WorkerData[]> {
  const pageSize = 100;
  let offset = 0;
  const allWorkers: WorkerData[] = [];

  while (true) {
    const response = await httpClient.sendRequest<WorkersResponse>({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams: {
        limit: String(pageSize),
        offset: String(offset),
      },
    });

    const workers = response.body.data ?? [];
    allWorkers.push(...workers);

    if (allWorkers.length >= response.body.total || workers.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allWorkers;
}

export const newWorkerCreated = createTrigger({
  auth: workdayAuth,
  name: 'new_worker_created',
  displayName: 'New Worker Created',
  description: 'Triggers when a new worker is added in Workday. Polls the staffing API to detect newly hired employees.',
  props: {},
  sampleData: {
    id: 'abc123def456abc123def456abc12300',
    workerId: 'EMP-001',
    descriptor: 'Jane Smith',
    workerType: { id: 'employee', descriptor: 'Employee' },
    primaryJob: {
      location: { id: 'loc001', descriptor: 'New York' },
      jobProfile: { id: 'jp001', descriptor: 'Software Engineer' },
      supervisoryOrganization: { id: 'org001', descriptor: 'Engineering' },
    },
    person: { email: 'jane.smith@example.com', phone: '+1-555-0100' },
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;

    const workers = await fetchAllWorkers(hostname, tenant, auth.access_token);
    const knownIds = workers.map((w) => w.id);

    await context.store.put<string[]>('known_worker_ids', knownIds);
  },

  async onDisable(context) {
    await context.store.delete('known_worker_ids');
  },

  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;

    const knownIds = (await context.store.get<string[]>('known_worker_ids')) ?? [];
    const knownSet = new Set(knownIds);

    const workers = await fetchAllWorkers(hostname, tenant, auth.access_token);
    const newWorkers = workers.filter((w) => !knownSet.has(w.id));

    if (newWorkers.length > 0) {
      const updatedIds = workers.map((w) => w.id);
      await context.store.put<string[]>('known_worker_ids', updatedIds);
    }

    return newWorkers;
  },

  async test(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;

    const response = await httpClient.sendRequest<WorkersResponse>({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: { limit: '5', offset: '0' },
    });

    return response.body.data ?? [];
  },
});
