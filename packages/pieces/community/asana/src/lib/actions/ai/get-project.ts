import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectOutputSchema } from '../../output-schemas';

export const asanaGetProjectAction = createAction({
  auth: asanaAuth,
  name: 'get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Get the details of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one project by gid with its name, description, archived and completed state, dates, owner, team, privacy, latest status update, members, followers and link. Use Get Project Task Counts for task totals. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects (object type project).',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/projects/${asanaUtils.pathSegment(context.propsValue.project)}`,
      operation: 'Get Project',
      query: { opt_fields: ASANA_FIELDS.project },
    });
  },
});
