import { TriggerStrategy, createTrigger, isNil } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { getProjects } from '../common';

export const newProject = createTrigger({
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created',
  aiMetadata: {
    description:
      'Fires when a new Jira project is created. Each event represents one newly created project with its full metadata (name, key, type, privacy setting, style). Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: '10000',
    key: 'PROJ',
    name: 'My Project',
    projectTypeKey: 'software',
    simplified: false,
    style: 'classic',
    isPrivate: false,
    self: 'https://instance.atlassian.net/rest/api/3/project/10000',
  },
  async onEnable(context) {
    const projects = await getProjects(context.auth);
    const ids = projects.map((p) => p.id);
    await context.store.put('projectIds', JSON.stringify(ids));
  },
  async onDisable(context) {
    await context.store.delete('projectIds');
  },
  async run(context) {
    const projects = await getProjects(context.auth);

    if (isNil(projects) || projects.length === 0) {
      return [];
    }

    const existingIds = (await context.store.get<string>('projectIds')) ?? '[]';
    const parsedExistingIds = JSON.parse(existingIds) as string[];

    const newProjects = projects.filter(
      (p) => !parsedExistingIds.includes(p.id)
    );

    if (newProjects.length === 0) {
      return [];
    }

    const newIds = newProjects.map((p) => p.id);
    await context.store.put(
      'projectIds',
      JSON.stringify([...newIds, ...parsedExistingIds])
    );

    return newProjects;
  },
  async test(context) {
    const projects = await getProjects(context.auth);

    if (isNil(projects)) {
      return [];
    }

    return projects;
  },
});
