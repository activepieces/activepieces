import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { calltidycalapi } from '../common';
import { tidyCalAuth } from '../auth';
import dayjs from 'dayjs';

export const tidycalnewcontact = createTrigger({
  auth: tidyCalAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  aiMetadata: {
    description: 'Fires when a new contact is added to the TidyCal account. A contact represents a person who has booked or interacted with the scheduling account, including their id, name, email, and creation timestamp. Use this to react to newly captured contacts, such as syncing them to a CRM or mailing list.',
  },
  props: {},
  sampleData: {
    data: [
      {
        id: '1',
        email: 'john@doe.com',
        name: 'John Doe',
        created_at: '2022-01-01T00:00:00.000000Z',
        updated_at: '2022-01-01T00:00:00.000000Z',
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<AppConnectionValueForAuthProperty<typeof tidyCalAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await calltidycalapi<{
      data: {
        id: string;
        created_at: string;
      }[];
    }>(HttpMethod.GET, `contacts`, auth, undefined);

    const createdcontacts = currentValues.body;
    const contact = createdcontacts.data.filter((item) => {
      const created_at = dayjs(item.created_at);
      return created_at.isAfter(lastFetchEpochMS);
    });
    return contact.map((item) => {
      return {
        epochMilliSeconds: dayjs(item.created_at).valueOf(),
        data: item,
      };
    });
  },
};
