import { spreadIfDefined } from '@activepieces/pieces-framework';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { rockTriggerOutputSchema } from '../common/output-schemas';
import { SAMPLE_ROCK } from '../common/samples';
import { createNinetyPollingTrigger } from './create-polling-trigger';

export const newRock = createNinetyPollingTrigger({
  name: 'new_rock',
  displayName: 'New Rock',
  description: 'Fires when a rock is created in Ninety',
  aiDescription:
    'Fires once for each new Ninety rock, the quarterly goal of the EOS model, carrying its id, title, owner, team, status, quarter and due date. Ninety has no webhooks and cannot sort rocks by creation date, so this reads the team active rocks and reports the ones created since the last check.',
  props: {
    teamId: ninetyProps.teamIdOptional,
    userId: ninetyProps.ownerIdFilter,
  },
  outputSchema: rockTriggerOutputSchema,
  sampleData: SAMPLE_ROCK,
  fetchRecords: async ({ token, propsValue }) => {
    const { items } = await ninetyCommon.queryRocks({
      token,
      query: {
        sortField: 'dueDate',
        sortDirection: 'DESC',
        pageIndex: 0,
        pageSize: 200,
        archived: false,
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('userId', propsValue.userId),
      },
    });
    return items;
  },
});
