import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, buildWorkflowOptions } from '../common';
import { savvyCalAuth, getToken } from '../auth';

interface SavvyCalWorkflowRule {
  id: string;
  trigger?: string;
  action?: string;
  delay?: number | null;
  config?: Record<string, unknown> | null;
}

export const getWorkflowRulesAction = createAction({
  auth: savvyCalAuth,
  name: 'get_workflow_rules',
  displayName: 'Get Workflow Rules',
  description: 'Returns the rules configured for a specific workflow.',
  props: {
    workflow_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Workflow',
      description: 'Select the workflow whose rules you want to retrieve.',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildWorkflowOptions(getToken(auth));
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load workflows.' };
        }
      },
    }),
  },
  async run(context) {
    const response = await savvyCalApiCall<{ entries: SavvyCalWorkflowRule[] } | SavvyCalWorkflowRule[]>({
      token: getToken(context.auth),
      method: HttpMethod.GET,
      path: `/workflows/${context.propsValue.workflow_id}/rules`,
    });
    const rules = Array.isArray(response.body) ? response.body : response.body.entries ?? [];
    return {
      workflow_id: context.propsValue.workflow_id,
      rules,
    };
  },
});
