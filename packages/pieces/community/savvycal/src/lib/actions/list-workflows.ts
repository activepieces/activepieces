import { createAction } from '@activepieces/pieces-framework';
import { savvyCalPaginatedCall } from '../common';
import { savvyCalAuth, getToken } from '../auth';

interface SavvyCalWorkflow {
  id: string;
  name: string;
  state?: string;
  created_at?: string;
}

export const listWorkflowsAction = createAction({
  auth: savvyCalAuth,
  name: 'list_workflows',
  classification: 'SEARCH',
  displayName: 'List Workflows',
  description: 'Returns all workflows configured in your SavvyCal account.',
  audience: 'both',
  aiMetadata: { description: 'Lists all SavvyCal automation workflows in the account with their ids, names, and state (draft, active, or paused). Use to discover available workflows, typically to obtain a workflow id for Get Workflow Rules. Read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const workflows = await savvyCalPaginatedCall<SavvyCalWorkflow>({
      token: getToken(context.auth),
      path: '/workflows',
    });
    return workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      state: workflow.state ?? null,
      active: workflow.state === 'active',
      created_at: workflow.created_at ?? null,
    }));
  },
});
