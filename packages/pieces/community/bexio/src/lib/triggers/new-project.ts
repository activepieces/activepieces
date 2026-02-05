import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bexioAuth>,
  { status_id?: number }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId, propsValue }) => {
    const client = new BexioClient(auth);

    const searchBody: Array<{ field: string; value: string; criteria: string }> = [
      {
        field: 'name',
        value: '',
        criteria: 'not_null',
      },
    ];

    if (propsValue.status_id !== undefined && propsValue.status_id !== null) {
      searchBody.push({
        field: 'pr_state_id',
        value: propsValue.status_id.toString(),
        criteria: '=',
      });
    }

    const queryParams: Record<string, string> = {
      order_by: 'id_desc',
      limit: '500',
    };

    const projects = await client.post<Array<{
      id: number;
      uuid: string;
      nr: string;
      name: string;
      start_date: string | null;
      end_date: string | null;
      comment: string | null;
      pr_state_id: number;
      pr_project_type_id: number;
      contact_id: number | null;
      contact_sub_id: number | null;
      pr_invoice_type_id: number | null;
      pr_invoice_type_amount: string | null;
      pr_budget_type_id: number | null;
      pr_budget_type_amount: string | null;
      user_id: number;
    }>>('/2.0/pr_project/search', searchBody, queryParams);

    return projects.map((project) => ({
      id: project.id,
      data: project,
    }));
  },
};

export const newProjectTrigger = createTrigger({
  auth: bexioAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a Project is created or updated with the chosen status',
  type: TriggerStrategy.POLLING,
  props: {
    status_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Status',
      description: 'Filter projects by status (leave empty to trigger for all statuses)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const statuses = await client.get<Array<{ id: number; name: string }>>('/2.0/pr_project_state').catch(() => []);

          if (statuses.length === 0) {
            return {
              disabled: false,
              placeholder: 'Status filter not available - will trigger for all statuses',
              options: [],
            };
          }

          return {
            disabled: false,
            options: statuses.map((status) => ({
              label: status.name,
              value: status.id,
            })),
          };
        } catch (error) {
          return {
            disabled: false,
            placeholder: 'Enter status ID manually or leave empty for all statuses',
            options: [],
          };
        }
      },
    }),
  },
  sampleData: {
    id: 2,
    uuid: '046b6c7f-0b8a-43b9-b35d-6489e6daee91',
    nr: '000002',
    name: 'Villa Kunterbunt',
    start_date: '2019-07-12 00:00:00',
    end_date: null,
    comment: '',
    pr_state_id: 2,
    pr_project_type_id: 2,
    contact_id: 2,
    contact_sub_id: null,
    pr_invoice_type_id: 3,
    pr_invoice_type_amount: '230.00',
    pr_budget_type_id: 1,
    pr_budget_type_amount: '200.00',
    user_id: 1,
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

