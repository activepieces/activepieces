import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../';
import { gitlabCommon, makeClient } from '../common';

export const createIssueAction = createAction({
  auth: gitlabAuth,
  name: 'create_issue',
  description: 'Create a project issue',
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
