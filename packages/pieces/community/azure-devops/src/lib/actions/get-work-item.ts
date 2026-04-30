import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureDevOpsAuth } from '../common';
import {
  azureDevOpsCommon,
  AzureDevOpsWorkItem,
} from '../common';

export const getWorkItemAction = createAction({
  auth: azureDevOpsAuth,
  name: 'get_work_item',
  displayName: 'Get Work Item',
  description: 'Retrieves a work item by ID from Azure DevOps',
  props: {
    project: azureDevOpsCommon.projectDropdown,
    work_item_id: Property.Number({
      displayName: 'Work Item ID',
      description:
        'Numeric ID of the work item (e.g. 123). To pass it dynamically, reference the ID from a previous step (e.g. `{{trigger.id}}`), not the title.',
      required: true,
    }),
  },
  async run(context) {
    const { project, work_item_id } = context.propsValue;
    const auth = context.auth;
    const orgUrl = azureDevOpsCommon.sanitizeOrgUrl(auth.props.organizationUrl);

    const response = await azureDevOpsCommon.apiCall<AzureDevOpsWorkItem>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.GET,
      endpoint: `/${encodeURIComponent(project)}/_apis/wit/workitems/${work_item_id}`,
      queryParams: {
        '$expand': 'all',
        'api-version': '7.1',
      },
    });

    return azureDevOpsCommon.flattenWorkItem(response);
  },
});
