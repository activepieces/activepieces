import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newPersonPolling: Polling<
  PiecePropValueSchema<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${propsValue.project}/persons`,
      token
    );

    const persons = response.body || [];
    return persons.map((person: any) => ({
      epochMilliSeconds: dayjs(person.created_at).valueOf(),
      data: person,
    }));
  },
};

export const newPerson = createTrigger({
  auth: meistertaskAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is added to a project.',
  props: {
    project: meisterTaskCommon.project,
  },
  sampleData: {
    id: 11111111,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    created_at: '2024-01-15T09:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newPersonPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newPersonPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newPersonPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newPersonPolling, context);
  },
});
