import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureDevOpsAuth } from '../../';
import {
  azureDevOpsApiCall,
  azureDevOpsCommon,
  flattenWorkItem,
  AzureDevOpsWorkItem,
  JsonPatchOperation,
} from '../common';

export const createWorkItemAction = createAction({
  auth: azureDevOpsAuth,
  name: 'create_work_item',
  displayName: 'Create Work Item',
  description: 'Creates a new work item (Bug, Task, User Story, etc.) in Azure DevOps',
  props: {
    project: azureDevOpsCommon.projectDropdown,
    work_item_type: azureDevOpsCommon.workItemTypeDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the work item',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the work item (supports HTML)',
      required: false,
    }),
    assigned_to: Property.ShortText({
      displayName: 'Assigned To',
      description: 'Email or display name of the person to assign this work item to',
      required: false,
    }),
    priority: azureDevOpsCommon.priorityDropdown,
  },
  async run(context) {
    const { project, work_item_type, title, description, assigned_to, priority } =
      context.propsValue;
    const auth = context.auth;
    const orgUrl = azureDevOpsCommon.sanitizeOrgUrl(auth.props.organizationUrl);

    const operations: JsonPatchOperation[] = [
      { op: 'add', path: '/fields/System.Title', value: title },
    ];

    if (description) {
      operations.push({
        op: 'add',
        path: '/fields/System.Description',
        value: description,
      });
    }

    if (assigned_to) {
      operations.push({
        op: 'add',
        path: '/fields/System.AssignedTo',
        value: assigned_to,
      });
    }

    if (priority) {
      operations.push({
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.Priority',
        value: Number(priority),
      });
    }

    const response = await azureDevOpsApiCall<AzureDevOpsWorkItem>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.POST,
      endpoint: `/${encodeURIComponent(String(project))}/_apis/wit/workitems/$${encodeURIComponent(String(work_item_type))}`,
      queryParams: { 'api-version': '7.1' },
      body: operations,
      isJsonPatch: true,
    });

    return flattenWorkItem(response);
  },
});
