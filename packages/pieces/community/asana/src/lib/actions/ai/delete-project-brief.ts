import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteProjectBriefOutputSchema } from '../../output-schemas';

export const asanaDeleteProjectBriefAction = createAction({
  auth: asanaAuth,
  name: 'delete_project_brief',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project Brief',
  description: 'Delete the brief of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a project brief (the project itself is not affected). Irreversible; repeating the call on the same brief fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteProjectBriefOutputSchema,
  props: {
    project_brief: Property.ShortText({
      displayName: 'Project Brief GID',
      description: 'Gid of the project brief to delete. Obtain it from the project_brief field of Get Project.',
      required: true,
    }),
  },
  async run(context) {
    const projectBrief = context.propsValue.project_brief.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/project_briefs/${asanaUtils.pathSegment(projectBrief)}`,
      operation: 'Delete Project Brief',
    });
    return { success: true, project_brief_gid: projectBrief };
  },
});
