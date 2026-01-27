import { AppConnectionValueForAuthProperty, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../..';
import { FlowluClient } from './client';

export function makeClient(
  auth: AppConnectionValueForAuthProperty<typeof flowluAuth>
): FlowluClient {
  const client = new FlowluClient(auth.props.domain, auth.props.apiKey);
  return client;
}
function mapItemsToOptions(items: { id: string | number; name: string }[]) {
  return items.map((item) => ({ label: item.name, value: item.id }));
}
export const flowluCommon = {
  task_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Task ID',
      required,
      refreshers: [],
      auth: flowluAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllTasks();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  user_id: (required = true, displayName = 'User ID') =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllUsers();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  workflow_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Task Workflow ID',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllTaskWorkflow();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  workflow_stage_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Task Workflow Status ID',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllTaskStages();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  honorific_title_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Title',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const res = await client.listAllHonorificTitles();
        const { response } = res;
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  account_category_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Account Category',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllAccountCategories();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  industry_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Account Industry',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllAccountIndustries();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  source_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Opportunity Source',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllOpportunitySources();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  opportunity_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Opportunity ID',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllOpportunities();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  account_id: (
    required = false,
    displayName = 'Account ID',
    description = ''
  ) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllAccounts();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  contact_id: (
    required = false,
    displayName = 'Contact ID',
    description = ''
  ) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listAllContacts();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  pipeline_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Sales Pipeline ID',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listSalesPipelines();
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  pipeline_stage_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Sales Pipeline Stage ID',
      required,
      refreshers: ['pipeline_id'],
      options: async ({ auth, pipeline_id }) => {
        if (!auth || !pipeline_id) {
          return {
            disabled: true,
            placeholder:
              'Connect your account first and select sales pipeline.',
            options: [],
          };
        }
        const client = makeClient(
          auth
        );
        const { response } = await client.listSalesPipelineStages(
          pipeline_id as number
        );
        return {
          disabled: false,
          options: response.items.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
};
