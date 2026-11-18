import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const setJourneyStatusAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_set_journey_status_ai',
  classification: 'WRITE',
  displayName: 'Start or Stop Journey (AI)',
  description: 'Starts or stops a whole journey.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts (START) or stops (STOP) a whole Tarvent automation journey by journey ID; starting can begin sending its emails to every contact it targets, so only start when the user asked for it. To move one contact use Enter or Exit Contact From Journey. Not idempotent: Tarvent may reject starting a running journey.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.journeyStatus,
  props: {
    journeyId: Property.ShortText({ displayName: 'Journey ID', description: 'The journey ID (from Find Journey).', required: true }),
    action: Property.StaticDropdown({ displayName: 'Action', description: 'START or STOP the journey.', required: true, options: { options: [{ label: 'Start', value: 'START' }, { label: 'Stop', value: 'STOP' }] } }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.setJourneyStatus({ auth: context.auth.props, journeyId: p.journeyId, start: p.action === 'START' });
  },
});
