import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    createTrigger,
    PiecePropValueSchema,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

const polling: Polling<
  PiecePropValueSchema<typeof microsoft365PeopleAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const contacts = await microsoft365PeopleCommon.listContacts({
      auth,
      queryParams:lastFetchEpochMS ===0?{$top:'10'} :{
        $filter: `lastModifiedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`,
        $orderby: 'lastModifiedDateTime desc',
      },
    });
    return contacts.map((contact) => ({
      epochMilliSeconds: dayjs(contact.lastModifiedDateTime).valueOf(),
      data: contact,
    }));
  },
};

export const newOrUpdatedContact = createTrigger({
  auth: microsoft365PeopleAuth,
  name: 'newOrUpdatedContact',
  displayName: 'New or Updated Contact',
  description:
    'Triggers when a contact is created or updated in Microsoft 365 People.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
