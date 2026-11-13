import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { listMilestones as fetchMilestones } from '../common';
import { niftyClient } from '../common/client';
import { listMilestonesOutputSchema } from '../output-schemas';

export const listMilestones = createAction({
  auth: niftyAuth,
  name: 'list_milestones',
  displayName: 'List Milestones and Lists',
  description: 'List the milestones and task lists of a project.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the dated milestones and plain task lists of a Nifty project, or only one kind. Use to get the milestone_id for creating or moving tasks. Requires project_id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', required: true }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Milestones and lists', value: 'all' },
          { label: 'Milestones only', value: 'milestones' },
          { label: 'Lists only', value: 'lists' },
        ],
      },
    }),
  },
  outputSchema: listMilestonesOutputSchema,
  async run(context) {
    const projectId = niftyClient.requireId({ value: context.propsValue.project_id, label: 'Project ID' });
    const kind = context.propsValue.kind ?? 'all';
    if (kind !== 'all' && kind !== 'milestones' && kind !== 'lists') {
      throw new Error(`Kind must be all, milestones or lists, got "${String(kind)}".`);
    }
    const items = await fetchMilestones({ auth: context.auth, projectId });
    return {
      items: items.filter((m) => kind === 'all' || (kind === 'lists') === (m['is_list'] === true)),
    };
  },
});
