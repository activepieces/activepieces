import { Property } from '@activepieces/pieces-framework';
import { skyprepAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const courceID = Property.Dropdown({
  auth: skyprepAuth,
  displayName: 'Course',
  description: 'Select the course',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth || !auth.secret_text) {
      return {
        disabled: true,
        options: [],
      };
    }
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/get_courses',
      {
        per_page: 100,
      }
    );

    return {
      disabled: false,
      options: response.map((course: any) => ({
        label: course.name,
        value: course.id || course.course_id,
      })),
    };
  },
});

export const user_idDropdown = Property.Dropdown({
  auth: skyprepAuth,
  displayName: 'User',
  description: 'Select the user',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth || !auth.secret_text) {
      return {
        disabled: true,
        options: [],
      };
    }
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/get_users',
      {
        per_page: 100,
      }
    );

    return {
      disabled: false,
      options: response.map((user: any) => ({
        label: ` ${user.username} (${user.first_name} ${user.last_name})`,
        value: user.id,
      })),
    };
  },
});
