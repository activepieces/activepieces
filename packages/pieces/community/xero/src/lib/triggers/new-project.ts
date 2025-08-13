import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof xeroAuth>,
  { tenant_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const tenantId = propsValue.tenant_id;

    // Calculate the date filter for new projects
    const fromDate = lastFetchEpochMS
      ? dayjs(lastFetchEpochMS).format('YYYY-MM-DD')
      : dayjs().subtract(7, 'days').format('YYYY-MM-DD'); // Default to last 7 days

    try {
      // Fetch projects with date filter using the Projects API
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        `/projects?createdByMyApp=false&page=1`,
        null,
        {
          'Xero-Tenant-Id': tenantId,
        }
      );

      const projects = response.projects || [];

      // Filter projects created since the last fetch
      const filteredProjects = projects.filter((project: any) => {
        const createdDate = dayjs(project.createdDateUtc);
        return createdDate.isAfter(dayjs(lastFetchEpochMS || fromDate));
      });

      // Map projects to the required format
      return filteredProjects.map((project: any) => ({
        epochMilliSeconds: dayjs(project.createdDateUtc).valueOf(),
        data: project,
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },
};

export const newProject = createTrigger({
  auth: xeroAuth,
  name: 'newProject',
  displayName: 'New Project',
  description: 'Fires when a new project is created in Xero',
  props: {
    tenant_id: props.tenant_id,
  },
  sampleData: {
    projectId: '12345678-1234-1234-1234-123456789012',
    name: 'Website Development Project',
    contactId: '87654321-4321-4321-4321-210987654321',
    deadlineUtc: '2025-12-31T23:59:59.000Z',
    createdDateUtc: '2025-08-13T10:30:00.000Z',
    updatedDateUtc: '2025-08-13T10:30:00.000Z',
    status: 'INPROGRESS',
    currencyCode: 'USD',
    minutesLogged: 0,
    totalTaskAmount: {
      currency: 'USD',
      value: 0.00,
    },
    totalExpenseAmount: {
      currency: 'USD',
      value: 0.00,
    },
    estimateAmount: {
      currency: 'USD',
      value: 10000.00,
    },
    minutesToBeInvoiced: 0,
    taskAmountToBeInvoiced: {
      currency: 'USD',
      value: 0.00,
    },
    taskAmountInvoiced: {
      currency: 'USD',
      value: 0.00,
    },
    expenseAmountToBeInvoiced: {
      currency: 'USD',
      value: 0.00,
    },
    expenseAmountInvoiced: {
      currency: 'USD',
      value: 0.00,
    },
    projectAmountInvoiced: {
      currency: 'USD',
      value: 0.00,
    },
    deposit: {
      currency: 'USD',
      value: 2000.00,
    },
    depositApplied: {
      currency: 'USD',
      value: 0.00,
    },
    creditNoteAmount: {
      currency: 'USD',
      value: 0.00,
    },
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