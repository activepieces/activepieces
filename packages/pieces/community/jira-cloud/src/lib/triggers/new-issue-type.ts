import { TriggerStrategy, createTrigger, isNil } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { getIssueTypes } from '../common';
import { getProjectIdDropdown } from '../common/props';

export const newIssueType = createTrigger({
  name: 'new_issue_type',
  displayName: 'New Issue Type',
  description: 'Triggers when a new issue type is created in a project',
  aiMetadata: {
    description:
      'Fires when a new issue type is added to a Jira project. Each event represents one newly created issue type with its full metadata (name, description, avatar, hierarchy level). Polling-based.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  props: {
    projectId: getProjectIdDropdown({
      displayName: 'Project',
      description: 'Select the project to watch for new issue types',
      required: true,
    }),
  },
  sampleData: {
    id: '10000',
    name: 'Story',
    description: 'A user story or feature request',
    isDefault: false,
    avatarId: 10500,
    hierarchyLevel: 0,
  },
  async onEnable(context) {
    const { projectId } = context.propsValue;

    const issueTypes = await getIssueTypes({
      auth: context.auth,
      projectId: projectId as string,
    });

    const ids = issueTypes.map((it) => it.id);
    await context.store.put('issueTypeIds', JSON.stringify(ids));
  },
  async onDisable(context) {
    await context.store.delete('issueTypeIds');
  },
  async run(context) {
    const { projectId } = context.propsValue;

    const issueTypes = await getIssueTypes({
      auth: context.auth,
      projectId: projectId as string,
    });

    if (isNil(issueTypes) || issueTypes.length === 0) {
      return [];
    }

    const existingIds = (await context.store.get<string>('issueTypeIds')) ?? '[]';
    const parsedExistingIds = JSON.parse(existingIds) as string[];

    const newIssueTypes = issueTypes.filter(
      (it) => !parsedExistingIds.includes(it.id)
    );

    if (newIssueTypes.length === 0) {
      return [];
    }

    const newIds = newIssueTypes.map((it) => it.id);
    await context.store.put(
      'issueTypeIds',
      JSON.stringify([...newIds, ...parsedExistingIds])
    );

    return newIssueTypes;
  },
  async test(context) {
    const { projectId } = context.propsValue;

    const issueTypes = await getIssueTypes({
      auth: context.auth,
      projectId: projectId as string,
    });

    if (isNil(issueTypes)) {
      return [];
    }

    return issueTypes;
  },
});
