import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
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
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) =>   {
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
    "id": 8,
    "firstname": "Jane",
    "lastname": "Demo",
    "email": "jane@example.com",
    "avatar": "https://www.example.com/files/avatars/jane.jpg",
    "avatar_thumb": "https://www.example.com/files/avatars/jane.jpg",
    "created_at": "2017-04-02T03:14:15.926535Z",
    "updated_at": "2017-04-02T03:14:15.926535Z"
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
