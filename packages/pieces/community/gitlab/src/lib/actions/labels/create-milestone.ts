import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { optionalDay } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalText, requireText } from '../../common/props';
import { milestoneOutputSchema } from '../../output-schemas-admin';

export const createMilestoneAction = createAction({
  auth: gitlabAuth,
  name: 'create_milestone',
  displayName: 'Create Milestone',
  description: 'Creates a milestone in a project.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a GitLab project milestone with a title and optional description, start date and due date. A title already used in the project fails with 400; check List Milestones first. The result id (not iid) is what Update Issue and the other milestone actions take.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    startDate: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD.', required: false }),
    dueDate: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: false }),
  },
  outputSchema: milestoneOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/milestones`,
      body: {
        title: requireText({ value: propsValue.title, label: 'Title' }),
        description: optionalText(propsValue.description),
        start_date: optionalDay({ value: propsValue.startDate, label: 'Start Date' }),
        due_date: optionalDay({ value: propsValue.dueDate, label: 'Due Date' }),
      },
    });
  },
});
