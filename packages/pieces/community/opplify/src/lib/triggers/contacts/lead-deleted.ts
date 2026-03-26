import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadDeleted = createOpplifyTrigger({
  name: 'lead_deleted',
  displayName: 'Lead Deleted',
  description:
    'Triggers when a lead is permanently deleted from the CRM.',
  eventType: 'lead_deleted',
  props: {},
  sampleData: SAMPLE_DATA.lead_deleted,
});
