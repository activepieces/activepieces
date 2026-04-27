import { createAction } from '@activepieces/pieces-framework';
import { savvyCalPaginatedCall } from '../common';
import { savvyCalAuth } from '../../';

interface SavvyCalWorkflow {
  id: string;
  name: string;
  active?: boolean;
  scope?: { id: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export const listWorkflowsAction = createAction({
  auth: savvyCalAuth,
  name: 'list_workflows',
  displayName: 'List Workflows',
  description: 'Returns all workflows configured in your SavvyCal account.',
  props: {},
  async run(context) {
    const workflows = await savvyCalPaginatedCall<SavvyCalWorkflow>({
      token: context.auth.secret_text,
      path: '/workflows',
    });
    return workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      active: workflow.active ?? null,
      team_id: workflow.scope?.id ?? null,
      team_name: workflow.scope?.name ?? null,
      created_at: workflow.created_at ?? null,
      updated_at: workflow.updated_at ?? null,
    }));
  },
});
