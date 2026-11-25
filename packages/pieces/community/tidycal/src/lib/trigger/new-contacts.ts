import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  MarkdownVariant,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { calltidycalapi } from '../common';
import { tidyCalAuth } from '../auth';
import dayjs from 'dayjs';

const props = {
  info: Property.MarkDown({
    value: 'Checks TidyCal periodically and runs once for each new contact.',
    variant: MarkdownVariant.INFO,
  }),
};

export const tidycalnewcontact = createTrigger({
  auth: tidyCalAuth,
  name: 'new_contact',
  classification: 'READ',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  aiMetadata: {
    description: 'Fires when a new contact is added to the TidyCal account. A contact represents a person who has booked or interacted with the scheduling account, including their id, name, email, and creation timestamp. Use this to react to newly captured contacts, such as syncing them to a CRM or mailing list.',
  },
  props,
  sampleData: {
    id: 1,
    email: 'john@doe.com',
    name: 'John Doe',
    created_at: '2022-01-01T00:00:00.000000Z',
    updated_at: '2022-01-01T00:00:00.000000Z',
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, context);
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, context);
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
});

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof tidyCalAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await calltidycalapi<{
      data: {
        id: number;
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
