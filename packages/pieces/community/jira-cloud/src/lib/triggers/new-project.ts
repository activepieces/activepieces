import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger, isNil, tryCatch } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import { JiraProject, getProjects, jiraPaginatedApiCall } from '../common';

import { projectTriggerOutputSchema } from '../output-schemas';
export const newProject = createTrigger({
  name: 'new_project',
  classification: 'READ',
  displayName: 'New Project',
  description:
    'Triggers when a new project is created, or when an existing project first becomes visible to the connected account.',
  aiMetadata: {
    description:
      'Fires when a new Jira project is created, or when an existing project first becomes visible to the connected account. Each event represents one newly created project with its full metadata (name, key, type, privacy setting, style). Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  outputSchema: projectTriggerOutputSchema,
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
    if (context.isRepublish && !isNil(await context.store.get('projectIds'))) {
      return;
    }
    await context.store.put('projectIds', JSON.stringify(await getKnownProjectIds(context.auth)));
  },
  async onDisable(context) {
    if (context.isRepublish) {
      return;
    }
    await context.store.delete('projectIds');
  },
  async run(context) {
    const existingIds = await context.store.get<string>('projectIds');
    if (isNil(existingIds)) {
      await context.store.put('projectIds', JSON.stringify(await getKnownProjectIds(context.auth)));
      return [];
    }

    const projects = await getProjects(context.auth);

    if (isNil(projects) || projects.length === 0) {
      return [];
    }

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

    return [...projects].sort((first, second) => Number(second.id) - Number(first.id)).slice(0, TEST_ITEMS_LIMIT);
  },
});

async function getKnownProjectIds(auth: JiraAuth): Promise<string[]> {
  const { data: allProjects } = await tryCatch(() =>
    jiraPaginatedApiCall<JiraProject, 'values'>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/project/search',
      query: { status: 'live,archived,deleted' },
      propertyName: 'values',
    })
  );
  const projects = allProjects ?? (await getProjects(auth));
  return projects.map((project) => project.id);
}

const TEST_ITEMS_LIMIT = 5;
