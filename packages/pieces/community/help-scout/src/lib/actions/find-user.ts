import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUser = createAction({
  auth: helpScoutAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Retrieve a Help Scout user by ID (as documented in Help Scout API).',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      userId: z.string().min(1, 'Please provide a valid user ID.'),
    });
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: `/users/${propsValue.userId}`,
      auth,
    });
    return response;
  },
}); 