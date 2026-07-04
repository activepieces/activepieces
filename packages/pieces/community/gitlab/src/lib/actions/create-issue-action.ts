import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../auth';
import { gitlabCommon, makeClient } from '../common';

export const createIssueAction = createAction({
  auth: gitlabAuth,
  name: 'create_issue',
  description: 'Create a project issue',
  audience: 'both',
  aiMetadata: { description: 'Creates a new issue in a GitLab project, identified by its numeric project ID, with a title and optional description. Use to open a bug report, feature request, or task. Not idempotent: each call creates a separate issue even with identical inputs.', idempotent: false },
  displayName: 'Create Issue',
  props: {
    projectId: gitlabCommon.projectId(),
    title: Property.ShortText({
      displayName: 'Issue Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Issue Description',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { projectId, title, description } = propsValue;
    const client = makeClient({ auth });
    return await client.createProjectIssue(projectId as string, {
      title: title,
      description: description,
    });
  },
});
