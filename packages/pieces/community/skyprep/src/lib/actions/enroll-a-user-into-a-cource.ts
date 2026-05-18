import { createAction, Property } from '@activepieces/pieces-framework';
import { skyprepAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { courceID, user_idDropdown } from '../common/props';

export const enrollAUserIntoACource = createAction({
  auth: skyprepAuth,
  name: 'enrollAUserIntoACource',
  displayName: 'Enroll a User Into a Course',
  description: 'Enroll a user into a course by user email or user ID',
  props: {
    user_id: user_idDropdown,
    course_id: courceID,
  },
  async run(context) {
    const { user_id, course_id } = context.propsValue;

    const body: any = {
      course_id,
      user_id,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/enroll_user_in_course',
      body
    );

    return response;
  },
});
