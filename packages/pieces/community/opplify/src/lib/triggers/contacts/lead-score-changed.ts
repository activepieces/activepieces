import { Property } from '@activepieces/pieces-framework';
import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadScoreChanged = createOpplifyTrigger({
  name: 'lead_score_changed',
  displayName: 'Lead Score Changed',
  description:
    "Triggers when a lead's score is adjusted — by tag rules, manual update, or workflow action.",
  eventType: 'score_changed',
  props: {
    minScore: Property.Number({
      displayName: 'Minimum Score',
      description:
        'Only trigger when the new score is at or above this value (optional)',
      required: false,
    }),
  },
  sampleData: SAMPLE_DATA.score_changed,
});
