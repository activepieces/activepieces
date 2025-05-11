import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAuth } from '../..';
import { fireflyService } from '../common/fireflyService';
import { propsValidation } from '@activepieces/pieces-common';
import {z} from 'zod';

export const findMeetingByQuery = createAction({
  auth: firefliesAuth,
  name: 'findMeetingByQuery',
  displayName: 'Find Meeting By Query',
  description: 'Search for a meeting using host, title, date, or participant email (e.g., retrieve a call based on partial info).',
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'The host of the meeting',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the meeting',
      required: false,
    }),
    from: Property.DateTime({
      displayName: 'From',
      description: 'The start date of the meeting',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To',
      description: 'The end date of the meeting',
      required: false,
    }),
    participant: Property.ShortText({
      displayName: 'Participant',
      description: 'The email of a participant in the meeting',
      required: false,
    })
  },
  async run({auth, propsValue}) {
    await propsValidation.validateZod(propsValue, {
      from: z.string().datetime('You must pass a valid ISO date').optional(),
      to: z.string().datetime('You must pass a valid ISO date').optional(),
      participant: z.string().email('You must pass a valid email').optional(),
      host: z.string().email('You must pass a valid email').optional(),
    });

    return await fireflyService.getTranscripts(auth, {
      hostEmail: propsValue.host,
      title: propsValue.title,
      from: propsValue.from,
      to: propsValue.to,
      participantEmail: propsValue.participant
    }) 
  },
});
