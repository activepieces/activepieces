import { Property } from '@activepieces/pieces-framework';
import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealStageChanged = createOpplifyTrigger({
  name: 'deal_stage_changed',
  displayName: 'Deal Stage Changed',
  description:
    'Triggers when a deal moves to a different pipeline stage.',
  eventType: 'deal_stage_changed',
  props: {
    newStage: Property.StaticDropdown({
      displayName: 'Filter by New Stage',
      description:
        'Only trigger when the deal moves to this stage (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Discovery', value: 'discovery' },
          { label: 'Proposal', value: 'proposal' },
          { label: 'Negotiation', value: 'negotiation' },
          { label: 'Closed Won', value: 'closed_won' },
          { label: 'Closed Lost', value: 'closed_lost' },
        ],
      },
    }),
  },
  sampleData: SAMPLE_DATA.deal_stage_changed,
});
