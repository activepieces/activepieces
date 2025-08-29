import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const findTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Finds a time entry by description.',
  props: {
    description: Property.ShortText({
      displayName: 'Description',
      required: true,
    }),
  },
  async run(context) {
    const { description } = context.propsValue;
    const timeEntries = await togglTrackApi.getTimeEntries(
      context.auth as string
    );
    return timeEntries.find((entry) => entry.description === description);
  },
});
