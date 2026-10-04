import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaSearchWorkspaceObjectsOutputSchema } from '../../output-schemas';

const RESOURCE_TYPE_OPTIONS = [
  { label: 'Task', value: 'task' },
  { label: 'Project', value: 'project' },
  { label: 'User', value: 'user' },
  { label: 'Tag', value: 'tag' },
  { label: 'Team', value: 'team' },
  { label: 'Portfolio', value: 'portfolio' },
  { label: 'Goal', value: 'goal' },
  { label: 'Custom field', value: 'custom_field' },
  { label: 'Project template', value: 'project_template' },
];

export const asanaSearchWorkspaceObjectsAction = createAction({
  auth: asanaAuth,
  name: 'search_workspace_objects',
  classification: 'SEARCH',
  displayName: 'Search Workspace Objects',
  description: 'Find tasks, projects, users, tags or teams by name in a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Name-based typeahead lookup in one workspace: returns the gid and name of matching tasks, projects, users, tags, teams and more. Use it to turn a name into the gid other actions need; it works on free plans. Results are fuzzy and capped at one page (up to 100), with no pagination. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaSearchWorkspaceObjectsOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace to search, for example 1201234567890123. Obtain it from List Workspaces or Get Current User.',
      required: true,
    }),
    resource_type: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Which kind of object to return.',
      required: true,
      options: { disabled: false, options: RESOURCE_TYPE_OPTIONS },
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to match against object names, for example "Q4 launch". Leave empty to get recently relevant objects of this type.',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of results to return, from 1 to 100. Defaults to 20.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace, resource_type, query, count } = context.propsValue;
    if (asanaUtils.hasValue(count) && (!Number.isInteger(count) || Number(count) < 1 || Number(count) > 100)) {
      throw new Error(`Count must be a whole number between 1 and 100, got ${count}.`);
    }
    const data = await asanaClient.asanaData<AsanaRecord[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/typeahead`,
      operation: 'Search Workspace Objects',
      query: { resource_type, query, count },
    });
    return { data };
  },
});
