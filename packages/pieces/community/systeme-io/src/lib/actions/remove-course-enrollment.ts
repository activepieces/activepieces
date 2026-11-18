import { createAction } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoInput } from '../common/client';
import { contactPicker, courseDropdown } from '../common/dropdowns';
import { systemeOps } from '../common/operations';
import { removalResultOutputSchema } from '../output-schemas';

export const removeCourseEnrollment = createAction({
  auth: systemeIoAuth,
  name: 'remove_course_enrollment',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Course Access',
  description: "Remove a contact's enrollment in a course",
  audience: 'both',
  aiMetadata: {
    description:
      "Removes a Systeme.io contact's access to a course by deleting their enrollment(s) in it; the contact and course stay. Use to revoke access after a refund or cancellation. Idempotent: if the contact is not enrolled it returns not_found=true and changes nothing.",
    idempotent: true,
  },
  props: {
    course_id: courseDropdown,
    contact_id: contactPicker({ required: true }),
  },
  outputSchema: removalResultOutputSchema,
  async run(context) {
    const courseId = systemeIoInput.requireId({ value: context.propsValue.course_id, name: 'Course' });
    const contactId = systemeIoInput.requireId({ value: context.propsValue.contact_id, name: 'Contact' });
    return systemeOps.removeMatching<Enrollment>({
      apiKey: context.auth.secret_text,
      listUrl: '/school/enrollments',
      query: { course: courseId, contact: contactId },
      matches: (row) => Number(row.course?.id) === courseId && Number(row.contact?.id) === contactId,
      deleteUrl: (id) => `/school/enrollments/${id}`,
    });
  },
});

type Enrollment = { id?: unknown; course?: { id?: unknown }; contact?: { id?: unknown } };
