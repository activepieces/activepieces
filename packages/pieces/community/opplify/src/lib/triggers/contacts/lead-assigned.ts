import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadAssigned = createOpplifyTrigger({
  name: 'lead_assigned',
  displayName: 'Lead Assigned',
  description: 'Triggers when a lead is assigned to a team member.',
  eventType: 'lead_assigned',
  props: {},
  sampleData: SAMPLE_DATA.lead_assigned,
});
