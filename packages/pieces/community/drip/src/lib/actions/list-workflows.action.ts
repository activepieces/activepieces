import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listWorkflowsAction = createAction({
  auth: dripAuth,
  name: 'list_workflows',
  displayName: 'List Workflows',
  description: 'Lists workflows one page at a time.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Drip workflows (visual automations) one page at a time with ID, name and status (draft, active, paused). Use to find a Workflow ID for Start Workflow for Subscriber; pass the next page while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only workflows with this status. Defaults to all.',
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Draft', value: 'draft' }, { label: 'Paused', value: 'paused' }],
      },
    }),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.workflowPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: '/workflows',
      key: 'workflows',
      operation: 'list workflows',
      page,
      perPage,
      query: { status: propsValue.status },
    });
  },
});
