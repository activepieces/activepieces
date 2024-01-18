import { Property, createAction } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import {
  getIssueTypeIdDropdown,
  getProjectIdDropdown,
  getUsersDropdown,
} from '../common/props';
import { createJiraIssue, getPriorities } from '../common';

export const createIssue = createAction({
  name: 'create_issue',
  displayName: 'Create Issue',
  description: 'Create a new issue in a project',
  auth: jiraCloudAuth,
  props: {
    projectId: getProjectIdDropdown(),
    issueTypeId: getIssueTypeIdDropdown({ refreshers: ['projectId'] }),
    summary: Property.ShortText({
      displayName: 'Summary',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    assignee: getUsersDropdown({
      displayName: 'Assignee',
      refreshers: ['projectId'],
      required: false,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
          };
        }

        const priorities = await getPriorities({ auth: auth as JiraAuth });
        return {
          options: priorities.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
    parentKey: Property.ShortText({
      displayName: 'Parent Key',
      description: 'If this issue is a subtask, insert the parent issue key',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      projectId,
      issueTypeId,
      assignee,
      summary,
      description,
      priority,
      parentKey,
    } = propsValue;

    return await createJiraIssue({
      auth,
      projectId: projectId as string,
      summary,
      issueTypeId,
      assignee,
      description,
      priority,
      parentKey,
    });
  },
});
