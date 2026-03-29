import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayAuth } from '../auth';

export const findBoard = createAction({
  auth: foreplayAuth,
  name: 'find_board',
  displayName: 'Find Board',
  description: 'Find board associated with authenticated user',
  props: {
    board_name: Property.ShortText({
      displayName: 'Board Name',
      required: false,
    }),
  },
  async run(context) {
    const response = await fetch('https://public.api.foreplay.co/v1/boards', {
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Accept': 'application/json',
      },
    });
    return await response.json();
  },
});
