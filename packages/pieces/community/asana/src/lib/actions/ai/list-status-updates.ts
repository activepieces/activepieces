import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaStatusUpdateListOutputSchema } from '../../output-schemas';

export const asanaListStatusUpdatesAction = createAction({
  auth: asanaAuth,
  name: 'list_status_updates',
  classification: 'SEARCH',
  displayName: 'List Status Updates',
  description: 'List the status updates of an Asana project, portfolio or goal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the status updates posted on a project (or portfolio or goal), optionally only those created after a moment. Use it to review project health over time. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaStatusUpdateListOutputSchema,
  props: {
    parent: Property.ShortText({
      displayName: 'Parent GID',
      description: 'Gid of the project, portfolio or goal. Obtain a project gid from List Projects.',
      required: true,
    }),
    created_since: Property.ShortText({
      displayName: 'Created Since',
      description: 'Only return updates created after this ISO 8601 date-time, for example 2026-09-01T00:00:00Z.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'status updates' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { parent, created_since, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/status_updates',
      operation: 'List Status Updates',
      query: {
        parent: parent.trim(),
        created_since: asanaUtils.hasValue(created_since) ? String(created_since).trim() : undefined,
        opt_fields: ASANA_FIELDS.statusUpdate,
      },
      limit,
      offset,
    });
  },
});
