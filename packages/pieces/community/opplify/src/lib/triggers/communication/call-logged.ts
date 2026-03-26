import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const callLogged = createOpplifyTrigger({
  name: 'call_logged',
  displayName: 'Call Logged',
  description:
    'Triggers when a phone call is logged for a lead.',
  eventType: 'call_logged',
  sampleData: SAMPLE_DATA.call_logged,
});
