import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';
import dayjs from 'dayjs';

const polling: Polling<
  OAuth2PropertyValue,
  { status: string | undefined }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const api = createMyCaseApi(auth);
    
    const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();
    
    const queryParams: Record<string, string> = {
      'filter[updated_after]': lastFetchDate,
      page_size: '1000',
    };

    if (propsValue.status) {
      queryParams['filter[status]'] = propsValue.status;
    }

    const response = await api.get('/cases', queryParams);

    if (response.success && Array.isArray(response.data)) {
      return response.data.map((caseItem: any) => ({
        epochMilliSeconds: dayjs(caseItem.created_at).valueOf(),
        data: caseItem,
      }));
    }

    return [];
  },
};

export const caseAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'case_added_or_updated',
  displayName: 'Case Added or Updated',
  description: 'Triggers when a case has been added or updated',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter by case status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
  },
  sampleData: {
    id: 12345,
    name: 'Sample Case',
    case_number: 'CASE-001',
    description: 'Sample case description',
    opened_date: '2024-01-01',
    closed_date: null,
    sol_date: null,
    practice_area: 'Personal Injury',
    case_stage: 'Discovery',
    status: 'open',
    outstanding_balance: 5000,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
});
