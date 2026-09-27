import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps } from '../../common/client';

export const asanaListTaskTemplatesAction = createAction({
  auth: asanaAuth,
  name: 'list_task_templates',
  classification: 'SEARCH',
  displayName: 'List Task Templates',
  description: 'List the task templates of an Asana project (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the task templates saved in one project, with name, creator and creation time. Templates are per project, so set Project GID. Custom templates need a paid Asana plan. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project whose task templates to list. Obtain it from List Projects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'templates' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { project, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/task_templates',
      operation: 'List Task Templates',
      query: { project: project.trim(), opt_fields: ASANA_FIELDS.taskTemplate },
      limit,
      offset,
    });
  },
});
