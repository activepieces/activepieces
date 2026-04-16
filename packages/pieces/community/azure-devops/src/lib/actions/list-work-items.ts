import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureDevOpsAuth } from '../../';
import {
  azureDevOpsApiCall,
  azureDevOpsCommon,
  fetchWorkItemsByIds,
  WiqlResponse,
} from '../common';

const DEFAULT_WIQL = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] <> '' ORDER BY [System.ChangedDate] DESC`;

export const listWorkItemsAction = createAction({
  auth: azureDevOpsAuth,
  name: 'list_work_items',
  displayName: 'List Work Items',
  description: 'Lists work items from Azure DevOps using a WIQL query',
  props: {
    project: azureDevOpsCommon.projectDropdown,
    wiql_query: Property.LongText({
      displayName: 'WIQL Query',
      description: `The WIQL query to execute. Default: SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project ORDER BY [System.ChangedDate] DESC`,
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of work items to return (default: 50, max: 200)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { project, wiql_query, limit } = context.propsValue;
    const auth = context.auth;
    const orgUrl = azureDevOpsCommon.sanitizeOrgUrl(auth.props.organizationUrl);

    const query = wiql_query || DEFAULT_WIQL;
    const maxItems = Math.min(limit ?? 50, 200);

    const wiqlResponse = await azureDevOpsApiCall<WiqlResponse>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.POST,
      endpoint: `/${encodeURIComponent(String(project))}/_apis/wit/wiql`,
      queryParams: {
        '$top': String(maxItems),
        'api-version': '7.1',
      },
      body: { query },
    });

    if (!wiqlResponse.workItems || wiqlResponse.workItems.length === 0) {
      return [];
    }

    const ids = wiqlResponse.workItems.map((wi) => wi.id);

    const workItems = await fetchWorkItemsByIds({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      ids,
    });

    return workItems;
  },
});
