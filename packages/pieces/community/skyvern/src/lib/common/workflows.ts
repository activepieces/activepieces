import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './index';

interface SkyvernAuth {
  apiKey: string;
}

export const workflowDropdown = Property.Dropdown({
  displayName: 'Workflow',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Skyvern account',
        options: [],
      };
    }

    const { apiKey } = auth as SkyvernAuth;

    const workflowsResponse = await makeRequest(
      { apiKey },
      HttpMethod.GET,
      '/workflows'
    );

    const workflows = workflowsResponse?.workflows || workflowsResponse || [];

    const options: DropdownOption<string>[] = workflows.map(
      (workflow: any) => ({
        label: workflow.title || workflow.workflow_id,
        value: workflow.workflow_id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});
