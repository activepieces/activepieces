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

export const updateWorkItemAction = createAction({
  auth: azureDevOpsAuth,
  name: 'update_work_item',
  displayName: 'Update Work Item',
  description: 'Updates an existing work item in Azure DevOps',
  props: {
    project: azureDevOpsCommon.projectDropdown,
    work_item_id: Property.Number({
      displayName: 'Work Item ID',
      description: 'The ID of the work item to update (e.g. 123)',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the work item',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description for the work item (supports HTML)',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'New state for the work item (e.g. Active, Resolved, Closed)',
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
    const { project, work_item_id, title, description, state, assigned_to, priority } =
      context.propsValue;
    const auth = context.auth;
    const orgUrl = azureDevOpsCommon.sanitizeOrgUrl(auth.props.organizationUrl);
    const encodedProject = encodeURIComponent(String(project));

    const operations: JsonPatchOperation[] = [];

    if (title !== undefined && title !== '') {
      operations.push({
        op: 'replace',
        path: '/fields/System.Title',
        value: title,
      });
    }

    if (description !== undefined && description !== '') {
      operations.push({
        op: 'replace',
        path: '/fields/System.Description',
        value: description,
      });
    }

    if (state !== undefined && state !== '') {
      operations.push({
        op: 'replace',
        path: '/fields/System.State',
        value: state,
      });
    }

    if (assigned_to !== undefined && assigned_to !== '') {
      operations.push({
        op: 'replace',
        path: '/fields/System.AssignedTo',
        value: assigned_to,
      });
    }

    if (priority !== undefined && priority !== null) {
      operations.push({
        op: 'replace',
        path: '/fields/Microsoft.VSTS.Common.Priority',
        value: Number(priority),
      });
    }

    if (operations.length === 0) {
      const getResponse = await azureDevOpsApiCall<AzureDevOpsWorkItem>({
        organizationUrl: orgUrl,
        pat: auth.props.pat,
        method: HttpMethod.GET,
        endpoint: `/${encodedProject}/_apis/wit/workitems/${work_item_id}`,
        queryParams: {
          '$expand': 'all',
          'api-version': '7.1',
        },
      });
      return flattenWorkItem(getResponse);
    }

    const response = await azureDevOpsApiCall<AzureDevOpsWorkItem>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.PATCH,
      endpoint: `/${encodedProject}/_apis/wit/workitems/${work_item_id}`,
      queryParams: { 'api-version': '7.1' },
      body: operations,
      isJsonPatch: true,
    });

    return flattenWorkItem(response);
  },
});
