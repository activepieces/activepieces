import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectBriefOutputSchema } from '../../output-schemas';

export const asanaGetProjectBriefAction = createAction({
  auth: asanaAuth,
  name: 'get_project_brief',
  classification: 'READ',
  displayName: 'Get Project Brief',
  description: 'Get the brief (overview document) of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one project brief by gid with its title, plain text, rich text, project and link. The brief gid is the project_brief field of Get Project. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectBriefOutputSchema,
  props: {
    project_brief: Property.ShortText({
      displayName: 'Project Brief GID',
      description: 'Gid of the project brief. Obtain it from the project_brief field of Get Project, or from Create Project Brief.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/project_briefs/${asanaUtils.pathSegment(context.propsValue.project_brief)}`,
      operation: 'Get Project Brief',
      query: { opt_fields: ASANA_FIELDS.projectBrief },
    });
  },
});
