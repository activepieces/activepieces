import { createAction, Property } from '@activepieces/pieces-framework';
import { fireflyService } from '../common/fireflyService';
import { firefliesAuth } from '../..';

export const getUserDetails = createAction({
  auth: firefliesAuth,
  name: 'getUserDetails',
  displayName: 'Get User Details',
  description:
    'Fetch profile information of a Fireflies user (e.g., personalize reports or access control logic).',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description:
        'The ID of the user whose recent meeting you want to retrieve',
      required: true,
    }),
  },
  run({ auth, propsValue }) {
    return fireflyService.getUser(auth, propsValue.userId);  
  },
});
