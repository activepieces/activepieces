import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

interface FreshserviceRequester {
  id: number;
  first_name: string;
  last_name: string;
  primary_email: string;
  job_title: string | null;
  phone: string | null;
  mobile_phone_number: string | null;
  created_at: string;
  updated_at: string;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const response = await freshserviceApiCall<{
      requesters: FreshserviceRequester[];
    }>({
      method: HttpMethod.GET,
      endpoint: 'requesters',
      auth,
      queryParams: {
        order_by: 'updated_at',
        order_type: 'desc',
        per_page: lastFetchEpochMS === 0 ? '10' : '100',
      },
    });

    return response.body.requesters.map((requester) => ({
      epochMilliSeconds: new Date(requester.updated_at).getTime(),
      data: requester,
    }));
  },
};

export const updatedRequester = createTrigger({
  auth: freshserviceAuth,
  name: 'updated_requester',
  displayName: 'Updated Requester',
  description: 'Triggers when an existing requester is updated in Freshservice.',
  props: {},
  sampleData: {
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    primary_email: 'jane.doe@example.com',
    job_title: 'Senior Software Engineer',
    phone: '+1-555-0100',
    mobile_phone_number: '+1-555-0101',
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-16T14:20:00Z',
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
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
    return await pollingHelper.poll(polling, context);
  },
});
