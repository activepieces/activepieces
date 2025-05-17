import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const createTimeEntryAction = createAction({
  auth: clockifyAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Log time in Clockify',
  props: {
    workspaceId: Property.ShortText({ displayName: 'Workspace ID', required: true }),
    projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    start: Property.ShortText({ displayName: 'Start Time (ISO)', required: true }),
    end: Property.ShortText({ displayName: 'End Time (ISO)', required: true }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, projectId, description, start, end } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/time-entries`,
      {
        start,
        end,
        description,
        projectId,
      }
    );
  },
});
