import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const updateJourneyStatus = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_journey_status',
  classification: 'WRITE',
  displayName: 'Start/Stop Journey',
  description: 'Starts or stops a journey.',
  audience: 'both',
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
    const id = tarventCommon.requireText({ value: context.propsValue.journeyId, label: 'Journey' });
    const start = context.propsValue.action === 'Start';
    await tarventClient.booleanMutation({
      auth: context.auth.props,
      operation: start ? 'StartJourney' : 'StopJourney',
      field: start ? 'startJourney' : 'stopJourney',
      argDefs: '$id: String!',
      args: 'id: $id',
      variables: { id },
    });
    return { success: true, journeyId: id, action: start ? 'START' : 'STOP' };
  },
});
