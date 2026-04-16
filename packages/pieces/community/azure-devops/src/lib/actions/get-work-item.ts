import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureDevOpsAuth } from '../../';
import {
  azureDevOpsApiCall,
  azureDevOpsCommon,
  flattenWorkItem,
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
      description: 'The ID of the work item to retrieve (e.g. 123)',
      required: true,
    }),
  },
  async run(context) {
    const { project, work_item_id } = context.propsValue;
    const auth = context.auth;
    const orgUrl = auth.props.organizationUrl.replace(/\/+$/, '');

    const response = await azureDevOpsApiCall<AzureDevOpsWorkItem>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.GET,
      endpoint: `/${project}/_apis/wit/workitems/${work_item_id}`,
      queryParams: {
        '$expand': 'all',
        'api-version': '7.1',
      },
    });

    return flattenWorkItem(response);
  },
});
