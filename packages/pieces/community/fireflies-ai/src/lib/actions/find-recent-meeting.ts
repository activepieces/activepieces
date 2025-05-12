import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAuth } from '../..';
import { fireflyService } from '../common/fireflyService';

export const findRecentMeeting = createAction({
  auth: firefliesAuth,
  name: 'findRecentMeeting',
  displayName: 'Find Recent Meeting',
  description:
    'Retrieve the latest meeting for a user (e.g., send a recap email of the most recent call).',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description:
        'The ID of the user whose recent meeting you want to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const user = await fireflyService.getUser(auth, propsValue.userId);

    if (!user.recent_meeting) {
      throw new Error('No recent meeting found for the user');
    }

    return await fireflyService.getTranscript(auth, user.recent_meeting);
  },
});
