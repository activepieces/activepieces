import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { projectDropdown, userSummary } from '../common';
import { youtrackClient } from '../common/client';
import { getProjectActionOutputSchema } from '../output-schemas';

export const getProjectAction = createAction({
  auth: youtrackAuth,
  name: 'get_project',
  classification: 'READ',
  outputSchema: getProjectActionOutputSchema,
  displayName: 'Get Project',
  description: 'Gets a project with its leader, team and time tracking settings (work types).',
  audience: 'both',
  aiMetadata: {
    description:
      'Read one YouTrack project by its ID (like "0-5"): name, short name, leader, team, and time tracking settings including the work item types (IDs usable as the Work Type of Log Work on Issue). Read-only and idempotent.',
    idempotent: true,
  },
  props: { project: projectDropdown },
  async run(context) {
    const projectId = youtrackClient.segment({ value: context.propsValue.project, label: 'Project' });
    const project = youtrackClient.recordOf(await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/admin/projects/${projectId}`,
      query: { fields: 'id,name,shortName,description,archived,leader(id,login,name),team(id,name)' },
      operation: 'read the project',
    }));
    const settings = youtrackClient.recordOf(await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/admin/projects/${projectId}/timeTrackingSettings`,
      query: { fields: 'enabled,estimate(field(name)),timeSpent(field(name)),workItemTypes(id,name)' },
      operation: 'read the time tracking settings of the project',
    }));
    const leader = userSummary(project['leader']);
    const team = youtrackClient.recordOf(project['team']);
    return {
      id: project['id'] ?? null,
      name: project['name'] ?? null,
      shortName: project['shortName'] ?? null,
      description: project['description'] ?? null,
      archived: project['archived'] ?? null,
      leader_id: leader.id,
      leader_login: leader.login,
      leader_name: leader.name,
      team_id: team['id'] ?? null,
      team_name: team['name'] ?? null,
      time_tracking_enabled: youtrackClient.booleanOrNull(settings['enabled']),
      estimate_field: youtrackClient.textOrNull(youtrackClient.recordOf(youtrackClient.recordOf(settings['estimate'])['field'])['name']),
      time_spent_field: youtrackClient.textOrNull(youtrackClient.recordOf(youtrackClient.recordOf(settings['timeSpent'])['field'])['name']),
      work_item_types: youtrackClient.records(settings['workItemTypes']).map((t) => ({ id: t['id'] ?? null, name: t['name'] ?? null })),
    };
  },
});
