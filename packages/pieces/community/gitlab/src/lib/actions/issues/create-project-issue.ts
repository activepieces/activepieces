import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  idList,
  optionalIsoDate,
  optionalPositiveInt,
  optionalText,
  requireText,
  stringList,
  triStateValue,
} from '../../common/props';
import { issueOutputSchema } from '../../output-schemas';

export const createProjectIssueAction = createAction({
  auth: gitlabAuth,
  name: 'create_project_issue',
  displayName: 'Create Project Issue',
  description: 'Creates an issue in a project given by ID or path.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new issue in a GitLab project identified by numeric ID or full path, with optional labels, assignees, milestone, due date and confidentiality. Use to open a bug, task or feature request. Not idempotent: each call creates a separate issue.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Markdown body of the issue.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Label names. Labels that do not exist yet are created.',
      required: false,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee User IDs',
      description: 'Numeric user IDs. Resolve a username with List Users.',
      required: false,
    }),
    milestoneId: Property.Number({
      displayName: 'Milestone ID',
      description: 'Global milestone ID (not the iid).',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'YYYY-MM-DD.',
      required: false,
    }),
    confidential: gitlabProps.triState(
      'Confidential',
      'Make the issue visible only to project members with at least Planner role.'
    ),
  },
  outputSchema: issueOutputSchema,
  async run({ auth, propsValue }) {
    const labels = stringList({ value: propsValue.labels, label: 'Labels' });
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/issues`,
      body: {
        title: requireText({ value: propsValue.title, label: 'Title' }),
        description: optionalText(propsValue.description),
        labels: labels?.join(','),
        assignee_ids: idList({
          value: propsValue.assigneeIds,
          label: 'Assignee User IDs',
        }),
        milestone_id: optionalPositiveInt({
          value: propsValue.milestoneId,
          label: 'Milestone ID',
        }),
        due_date: optionalIsoDate({
          value: propsValue.dueDate,
          label: 'Due Date',
        }),
        confidential: triStateValue(propsValue.confidential),
      },
    });
  },
});
