import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { listStatuses as fetchStatuses } from '../common';
import { niftyClient } from '../common/client';
import { listStatusesOutputSchema } from '../output-schemas';

export const listStatuses = createAction({
  auth: niftyAuth,
  name: 'list_statuses',
  displayName: 'List Statuses',
  description: 'List the status columns of a project.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every status (board column) of a Nifty project in board order. Use to get the status_id that Create Task and Update Task need. Requires project_id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', required: true }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
  },
  outputSchema: listStatusesOutputSchema,
  async run(context) {
    const projectId = niftyClient.requireId({ value: context.propsValue.project_id, label: 'Project ID' });
    const items = await fetchStatuses({
      auth: context.auth,
      projectId,
      includeArchived: context.propsValue.include_archived === true,
    });
    return { items };
  },
});
