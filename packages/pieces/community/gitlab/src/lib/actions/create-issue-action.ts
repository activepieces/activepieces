import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../auth';
import { gitlabCommon } from '../common';
import { gitlabRequest, projectPath } from '../common/client';
import { optionalText, requireText } from '../common/props';
import { issueOutputSchema } from '../output-schemas';

export const createIssueAction = createAction({
  auth: gitlabAuth,
  name: 'create_issue',
  classification: 'WRITE',
  description: 'Create a project issue',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new issue in a GitLab project chosen from a dropdown, with a title and optional description. Not idempotent: each call creates a separate issue even with identical inputs.',
    idempotent: false,
  },
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
  outputSchema: issueOutputSchema,
  async run({ propsValue, auth }) {
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(String(propsValue.projectId))}/issues`,
      body: {
        title: requireText({ value: propsValue.title, label: 'Issue Title' }),
        description: optionalText(propsValue.description),
      },
    });
  },
});
