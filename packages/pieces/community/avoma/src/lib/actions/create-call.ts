import { createAction, Property } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const createCallAction = createAction({
  auth: avomaAuth,
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Creates a new call in Avoma',
  props: {
    title: Property.ShortText({
      displayName: 'Call Title',
      required: true,
      description: 'Title of the call',
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      required: true,
      description: 'When the call should start',
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      required: true,
      description: 'Duration of the call in minutes',
    }),
    participants: Property.Array({
      displayName: 'Participants',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
      },
    }),
    agenda: Property.LongText({
      displayName: 'Agenda',
      required: false,
      description: 'Meeting agenda',
    }),
  },
  async run(context) {
    const client = createAvomaClient(context.auth);
    
    const callData = {
      title: context.propsValue.title,
      start_time: context.propsValue.startTime,
      duration_minutes: context.propsValue.duration,
      participants: context.propsValue.participants || [],
      agenda: context.propsValue.agenda,
    };

    try {
      const result = await client.createCall(callData);
      return {
        success: true,
        meeting: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});