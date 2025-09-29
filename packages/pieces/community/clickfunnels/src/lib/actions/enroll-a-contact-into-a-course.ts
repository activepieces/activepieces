import { createAction, Property } from '@activepieces/pieces-framework';
import { contactsDropdown, coursesDropdown, teamsDropdown, workspacesDropdown } from '../common/props';
import { clickfunnelsApiService } from '../common/requests';
import { clickfunnelsAuth } from '../common/constants';

export const enrollAContactIntoACourse = createAction({
  auth: clickfunnelsAuth,
  name: 'enrollAContactIntoACourse',
  displayName: 'Enroll a Contact Into a Course',
  description: 'Create an enrollment for a contact in a course.',
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    courseId: coursesDropdown(['auth', 'workspaceId']),
    contactId: contactsDropdown(['auth', 'workspaceId']),
  },
  async run({auth, propsValue}) {
    const payload = {
      courses_enrollment: {
        contact_id: propsValue.contactId
      },
    };

    const response = await clickfunnelsApiService.createCourseEnrollment(auth, propsValue.courseId as string, payload);

    return response;
  },
});
