import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema 
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { organizationIdDropdown } from '../common/props';
import { PodioWorkspace } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof podioAuth>, { orgId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const orgId = propsValue.orgId;
    const isTest = lastFetchEpochMS === 0;
    const sinceDate = new Date(lastFetchEpochMS);
    
    // Get all workspaces, optionally filtered by organization
    let resourceUri = '/space/';
    if (orgId) {
      resourceUri = `/org/${orgId}/space/`;
    }

    const response = await podioApiCall<PodioWorkspace[]>({
      auth,
      method: HttpMethod.GET,
      resourceUri,
    });

    const workspaces = Array.isArray(response) ? response : [response];
    
    // Filter workspaces created since last poll
    const filteredWorkspaces = isTest ? workspaces.slice(0, 5) : workspaces.filter(workspace => {
      const createdDate = new Date(workspace.created_on);
      return createdDate > sinceDate;
    });

    return filteredWorkspaces.map((workspace) => ({
      epochMilliSeconds: new Date(workspace.created_on).getTime(),
      data: workspace,
    }));
  },
};

export const newWorkspaceTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_workspace',
  displayName: 'New Workspace',
  description: 'Triggers when a new workspace is created in Podio.',
  props: {
    orgId: organizationIdDropdown('Organization', false),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  sampleData: {},
});