import { createAction, Property } from '@activepieces/pieces-framework';
import { skyprepAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const enrollAUserIntoACource = createAction({
  auth: skyprepAuth,
  name: 'enrollAUserIntoACource',
  displayName: 'Enroll a User Into a Course',
  description: 'Enroll a user into a course by user email or user ID',
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
    user_id: Property.Number({
      displayName: 'User ID',
      description: 'The ID of the user to enroll',
      required: false,
    }),
    course_id: Property.Number({
      displayName: 'Course ID',
      description: 'The ID of the course to enroll the user into',
      required: true,
    }),
  },
  async run(context) {
    const { user_identifier, user_email, user_id, course_id } =
      context.propsValue;

    const body: any = {
      course_id,
    };

    if (user_identifier === 'email') {
      body.user_email = user_email;
    } else {
      body.user_id = user_id;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/enroll_user_in_course',
      body
    );

    return response;
  },
});
