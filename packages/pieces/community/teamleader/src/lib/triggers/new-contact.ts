import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
const props = {};
// replace auth with piece auth variable
const polling: Polling<
  { access_token: string },
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    // implement the logic to fetch the items
    const items = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts.list',
      {
        updated_since: lastFetchEpochMS
          ? dayjs(lastFetchEpochMS).toISOString()
          : dayjs().subtract(1, 'day').toISOString(),
        status: 'active',
      }
    );
    return items.map((item: any) => ({
      epochMilliSeconds: dayjs(item.created_date).valueOf(),
      data: item,
    }));
  },
};

export const newContact = createTrigger({
  auth: teamleaderAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: '',
  props,
  sampleData: {
    id: '2a39e420-3ba3-4384-8024-fa702ef99c9f',
    first_name: 'Erlich',
    last_name: 'Bachman',
    status: 'active',
    salutation: 'Mr',
    emails: [
      {
        type: 'primary',
        email: 'info@piedpiper.eu',
      },
    ],
    telephones: [
      {
        type: 'phone',
        number: '092980615',
      },
    ],
    website: 'https://piedpiper.com',
    primary_address: {
      line_1: 'Dok Noord 3A 101',
      postal_code: '9000',
      city: 'Ghent',
      country: 'BE',
      area_level_two: {
        type: 'area_level_two',
        id: 'db232cf8-ad4a-024b-941f-15a7a74f0fd2',
      },
    },
    gender: 'unknown',
    birthdate: '1987-04-25',
    iban: 'BE12123412341234',
    bic: 'BICBANK',
    national_identification_number: '86792345-L',
    language: 'en',
    payment_term: {
      type: 'cash',
    },
    invoicing_preferences: {
      electronic_invoicing_address: null,
    },
    tags: ['prospect', 'expo'],
    added_at: '2016-02-04T16:44:33+00:00',
    updated_at: '2016-02-05T16:44:33+00:00',
    web_url:
      'https://focus.teamleader.eu/contact_detail.php?id=2a39e420-3ba3-4384-8024-fa702ef99c9f',
    custom_fields: [
      {
        definition: {
          type: 'customFieldDefinition',
          id: 'bf6765de-56eb-40ec-ad14-9096c5dc5fe1',
        },
        value: '092980616',
      },
    ],
  },
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
