import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';

const newPersonPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${propsValue.project}/persons`,
      token
    );

    const persons = Array.isArray(response.body) ? response.body : [];
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
    "id": 1,
    "firstname": "Jane",
    "lastname": "Doe",
    "email": "jane@example.com",
    "created_at": "2023-01-01T00:00:00.000Z"
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
