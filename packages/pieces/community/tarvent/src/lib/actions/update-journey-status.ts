import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const updateJourneyStatus = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_journey_status',
  classification: 'WRITE',
  displayName: 'Start/Stop Journey',
  description: 'Starts or stops a journey.',
  audience: 'human',
  aiMetadata: {
    description:
      'Starts or stops a whole Tarvent automation journey by journey ID (not one contact; use Add/Remove A Contact From A Journey for that). Starting a journey can begin sending its emails to every contact it targets. Returns the journey ID and action. Not marked idempotent: Tarvent may reject starting a journey that is already running.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.journeyStatus,
  props: {
    journeyId: tarventCommon.journeyId(true, 'Journey to start or stop.'),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Select whether to start or stop the journey.',
      required: true,
      options: {
        options: [
          { label: 'Start', value: 'Start' },
          { label: 'Stop', value: 'Stop' },
        ],
      },
    }),
  },
  async run(context) {
    return tarventOperations.setJourneyStatus({ auth: context.auth.props, journeyId: context.propsValue.journeyId, start: context.propsValue.action === 'Start' });
  },
});
