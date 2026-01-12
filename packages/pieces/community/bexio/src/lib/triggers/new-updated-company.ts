import { createTrigger, TriggerStrategy, PiecePropValueSchema, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bexioAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const client = new BexioClient(auth);

    const isTest = lastFetchEpochMS === 0;

    const lastFetchDate = isTest
      ? dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
      : dayjs(lastFetchEpochMS).format('YYYY-MM-DD HH:mm:ss');

    const searchBody = [
      {
        field: 'contact_type_id',
        value: '1', // 1 = company
        criteria: '=',
      },
      {
        field: 'updated_at',
        value: lastFetchDate,
        criteria: '>=',
      },
    ];

    const queryParams: Record<string, string> = {
      order_by: 'updated_at_desc',
      limit: isTest ? '5' : '500', // Limit to 5 for test, 500 for normal polling
    };

    const companies = await client.post<Array<{
      id: number;
      nr?: string | null;
      contact_type_id: number;
      name_1: string;
      name_2?: string | null;
      salutation_id?: number | null;
      salutation_form?: string | null;
      title_id?: number | null;
      birthday?: string | null;
      address?: string | null;
      street_name?: string | null;
      house_number?: string | null;
      address_addition?: string | null;
      postcode?: string | null;
      city?: string | null;
      country_id?: number | null;
      mail?: string | null;
      mail_second?: string | null;
      phone_fixed?: string | null;
      phone_fixed_second?: string | null;
      phone_mobile?: string | null;
      fax?: string | null;
      url?: string | null;
      skype_name?: string | null;
      remarks?: string | null;
      language_id?: number | null;
      is_lead?: boolean;
      contact_group_ids?: string | null;
      contact_branch_ids?: string | null;
      user_id?: number;
      owner_id?: number;
      updated_at?: string;
    }>>('/2.0/contact/search', searchBody, queryParams);

    return companies.map((company) => {
      const updatedAt = company.updated_at || new Date().toISOString();
      const epochMilliSeconds = dayjs(updatedAt).valueOf();

      return {
        epochMilliSeconds,
        data: company,
      };
    });
  },
};

export const newUpdatedCompanyTrigger = createTrigger({
  auth: bexioAuth,
  name: 'new_updated_company',
  displayName: 'New/Updated Company',
  description: 'Triggers when a company is added or updated',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 4,
    nr: null,
    contact_type_id: 1,
    name_1: 'Example Company',
    name_2: null,
    salutation_id: 2,
    salutation_form: null,
    title_id: null,
    birthday: null,
    address: 'Smith Street 22',
    street_name: 'Smith Street',
    house_number: '77',
    address_addition: 'Building C',
    postcode: '8004',
    city: 'Zurich',
    country_id: 1,
    mail: 'contact@example.org',
    mail_second: '',
    phone_fixed: '',
    phone_fixed_second: '',
    phone_mobile: '',
    fax: '',
    url: '',
    skype_name: '',
    remarks: '',
    language_id: null,
    is_lead: false,
    contact_group_ids: '1,2',
    contact_branch_ids: null,
    user_id: 1,
    owner_id: 1,
    updated_at: '2019-04-08 13:17:32',
  },
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
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
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
});

