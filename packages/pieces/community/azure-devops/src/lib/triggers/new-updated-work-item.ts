import {
  createTrigger,
  TriggerStrategy,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { azureDevOpsAuth, AzureDevOpsAuth } from '../../';
import {
  azureDevOpsCommon,
  FlatWorkItem,
  WiqlResponse,
} from '../common';

const props = {
  project: azureDevOpsCommon.projectDropdown,
  work_item_type: azureDevOpsCommon.workItemTypeDropdownOptional,
  state_filter: azureDevOpsCommon.stateDropdownOptional,
};

const POLLING_FIRST_RUN_LOOKBACK_DAYS = 14;

const polling: Polling<AzureDevOpsAuth, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const orgUrl = azureDevOpsCommon.sanitizeOrgUrl(auth.props.organizationUrl);
    const { project, work_item_type, state_filter } = propsValue;

    const sinceEpoch =
      lastFetchEpochMS && lastFetchEpochMS > 0
        ? lastFetchEpochMS
        : Date.now() - POLLING_FIRST_RUN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
    const sinceIso = new Date(sinceEpoch).toISOString();

    const escapedProject = azureDevOpsCommon.escapeWiqlString(project as string);
    let wiqlQuery =
      `SELECT [System.Id], [System.ChangedDate] FROM WorkItems ` +
      `WHERE [System.TeamProject] = '${escapedProject}' ` +
      `AND [System.ChangedDate] >= '${sinceIso}'`;

    if (work_item_type) {
      const escapedType = azureDevOpsCommon.escapeWiqlString(work_item_type as string);
      wiqlQuery += ` AND [System.WorkItemType] = '${escapedType}'`;
    }

    if (state_filter) {
      const escapedState = azureDevOpsCommon.escapeWiqlString(state_filter as string);
      wiqlQuery += ` AND [System.State] = '${escapedState}'`;
    }

    wiqlQuery += ' ORDER BY [System.ChangedDate] DESC';

    const wiqlResponse = await azureDevOpsCommon.apiCall<WiqlResponse>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.POST,
      endpoint: `/${encodeURIComponent(project as string)}/_apis/wit/wiql`,
      queryParams: {
        '$top': '200',
        'api-version': '7.1',
      },
      body: { query: wiqlQuery },
    });

    if (!wiqlResponse.workItems || wiqlResponse.workItems.length === 0) {
      return [];
    }

    const ids = wiqlResponse.workItems.map((wi) => wi.id);

    const workItems = await azureDevOpsCommon.fetchWorkItemsByIds({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      ids,
    });

    return workItems.map((item) => ({
      epochMilliSeconds: item.changed_date
        ? new Date(item.changed_date).getTime()
        : Date.now(),
      data: item,
    }));
  },
};

const sampleWorkItem: FlatWorkItem = {
  id: 123,
  rev: 1,
  url: 'https://dev.azure.com/myorg/myproject/_apis/wit/workItems/123',
  title: 'Fix login page bug',
  work_item_type: 'Bug',
  state: 'Active',
  reason: 'New',
  assigned_to: 'John Doe',
  assigned_to_email: 'john.doe@example.com',
  created_date: '2024-03-15T10:30:00Z',
  created_by: 'Jane Smith',
  changed_date: '2024-03-15T14:45:00Z',
  changed_by: 'John Doe',
  area_path: 'MyProject\\Backend',
  iteration_path: 'MyProject\\Sprint 5',
  priority: 2,
  description: '<p>Users cannot log in after password reset.</p>',
  project: 'MyProject',
};

export const newUpdatedWorkItemTrigger = createTrigger({
  auth: azureDevOpsAuth,
  name: 'new_updated_work_item',
  displayName: 'New or Updated Work Item',
  description:
    'Polls Azure DevOps every few minutes and fires when a work item is created or updated. Pick a work item type to unlock the state filter.',
  props,
  sampleData: sampleWorkItem,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
