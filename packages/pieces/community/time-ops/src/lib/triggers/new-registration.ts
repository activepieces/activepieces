import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL } from '../common';

interface Registration {
  id: number;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  projectId: number | null;
  userId: number;
  billable: boolean;
  tags: number[] | null;
}

interface RegistrationResponse {
  pageSize: number;
  page: number;
  totalResults: number;
  results: Registration[];
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof timeOpsAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const response = await httpClient.sendRequest<RegistrationResponse>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/Registrations`,
      headers: {
        'x-api-key': auth.secret_text,
      },
      queryParams: {
        pageSize: '100',
        page: '0',
      },
    });

    const registrations = response.body.results ?? [];

    return registrations
      .sort((a, b) => b.id - a.id)
      .map((registration) => ({
        id: registration.id,
        data: registration,
      }));
  },
};

export const newRegistration = createTrigger({
  auth: timeOpsAuth,
  name: 'new_registration',
  displayName: 'New Registration',
  description: 'Triggers when new registrations are added.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 1,
    description: 'Working on project',
    startedAt: '2024-01-15T09:00:00Z',
    stoppedAt: '2024-01-15T17:00:00Z',
    projectId: 1,
    userId: 1,
    billable: true,
    tags: [],
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
