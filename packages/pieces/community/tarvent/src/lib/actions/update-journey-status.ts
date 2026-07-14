import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';

export const updateJourneyStatus = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_journey_status',
  displayName: 'Start/Stop Journey',
  description: 'Starts or stops a journey.',
  audience: 'both',
  aiMetadata: { description: 'Starts or stops a Tarvent automation journey, with the direction chosen by the action input. Use to activate or pause an entire journey (not an individual contact). Idempotent: it sets the journey to a target run state, so repeating with the same value has no further effect.', idempotent: true },
  props: {
    journeyId: tarventCommon.journeyId(true, 'Select which journey to start or stop'),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Select whether to start or stop the journey.',
      required: true,
      options: {
        options: [
          {
            label: 'Start',

            value: 'Start',
          },
          {
            label: 'Stop',
            value: 'Stop',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { journeyId, action } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.updateJourneyStatus(action, journeyId);
  },
});
