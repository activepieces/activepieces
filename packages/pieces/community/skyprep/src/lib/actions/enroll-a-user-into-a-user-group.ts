import { createAction, Property } from '@activepieces/pieces-framework';
import { skyprepAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { user_idDropdown } from '../common/props';

export const enrollAUserIntoAUserGroup = createAction({
  auth: skyprepAuth,
  name: 'enrollAUserIntoAUserGroup',
  displayName: 'Enroll a User Into a User Group',
  description: 'Enroll a user into a user group by user email or user ID',
  props: {
    user_identifier: Property.StaticDropdown({
      displayName: 'User Identifier Type',
      description: 'Choose whether to identify the user by email or ID',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'User ID', value: 'user_id' },
        ],
      },
      required: true,
    }),
    user_email: Property.ShortText({
      displayName: 'User Email',
      description: 'The email address of the user to enroll',
      required: false,
    }),
    user_id:user_idDropdown,
    user_group_id: Property.Number({
      displayName: 'User Group ID',
      description: 'The ID of the user group to enroll the user into',
      required: true,
    }),
    user_group_enrollment_expiration_date: Property.ShortText({
      displayName: 'Enrollment Expiration Date',
      description:
        'Optional: The date when the enrollment will expire (e.g., "2024-12-31")',
      required: false,
    }),
  },
  async run(context) {
    const {
      user_identifier,
      user_email,
      user_id,
      user_group_id,
      user_group_enrollment_expiration_date,
    } = context.propsValue;

    const body: any = {
      user_group_id,
    };

    if (user_identifier === 'email') {
      body.user_email = user_email;
    } else {
      body.user_id = user_id;
    }

    if (user_group_enrollment_expiration_date) {
      body.user_group_enrollment_expiration_date =
        user_group_enrollment_expiration_date;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/enroll_user_in_user_group',
      body
    );

    return response;
  },
});
