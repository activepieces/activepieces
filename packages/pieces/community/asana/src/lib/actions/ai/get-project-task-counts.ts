import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectTaskCountsOutputSchema } from '../../output-schemas';

export const asanaGetProjectTaskCountsAction = createAction({
  auth: asanaAuth,
  name: 'get_project_task_counts',
  classification: 'READ',
  displayName: 'Get Project Task Counts',
  description: 'Get the number of total, completed and open tasks and milestones in a project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns task and milestone totals for one project (total, completed, incomplete). Use it for progress summaries instead of paging through List Project Tasks. Asana rate-limits this endpoint more strictly, so avoid calling it in tight loops. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectTaskCountsOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
  },
  async run(context) {
    const project = context.propsValue.project.trim();
    const counts = await asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/projects/${asanaUtils.pathSegment(project)}/task_counts`,
      operation: 'Get Project Task Counts',
      query: { opt_fields: ASANA_FIELDS.taskCounts },
    });
    return { project_gid: project, ...counts };
  },
});
