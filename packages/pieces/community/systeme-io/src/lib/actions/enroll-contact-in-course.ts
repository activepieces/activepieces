import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon, systemeIoInput } from '../common/client';
import { accessTypeDropdown, contactPicker, courseDropdown, courseModulesDropdown } from '../common/dropdowns';
import { enrollmentRow } from '../common/mappers';
import { enrollmentOutputSchema } from '../output-schemas';

export const enrollContactInCourse = createAction({
  auth: systemeIoAuth,
  name: 'enroll_contact_in_course',
  classification: 'WRITE',
  displayName: 'Enroll Contact in Course',
  description: 'Give a contact access to a course (full, partial, or drip-fed)',
  audience: 'both',
  aiMetadata: {
    description:
      "Enrolls a Systeme.io contact in a course, giving full access, access to selected modules only, or drip-fed access. Use after a purchase or signup to grant course access; partial_access and partial_dripping_access require module ids from the course. Not idempotent: behaviour on a repeat enrollment is undocumented, so check the contact's enrollments first if unsure.",
    idempotent: false,
  },
  props: {
    course_id: courseDropdown,
    contact_id: contactPicker({ required: true }),
    access_type: accessTypeDropdown,
    modules: courseModulesDropdown,
  },
  outputSchema: enrollmentOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return enroll({
      apiKey: context.auth.secret_text,
      courseId: p.course_id,
      contactId: p.contact_id,
      accessType: p.access_type,
      modules: p.modules,
    });
  },
});

async function enroll({
  apiKey,
  courseId,
  contactId,
  accessType,
  modules,
}: {
  apiKey: string;
  courseId: unknown;
  contactId: unknown;
  accessType: unknown;
  modules: unknown;
}) {
  const course = systemeIoInput.requireId({ value: courseId, name: 'Course' });
  const contact = systemeIoInput.requireId({ value: contactId, name: 'Contact' });
  const access = String(accessType ?? 'full_access');
  if (!ACCESS_TYPES.includes(access)) {
    throw new Error(`Access type must be one of: ${ACCESS_TYPES.join(', ')}.`);
  }
  const partial = access === 'partial_access' || access === 'partial_dripping_access';
  const moduleIds = partial ? systemeIoInput.idList({ value: modules, name: 'Module' }) : [];
  if (partial && moduleIds.length === 0) {
    throw new Error(`Access type "${access}" needs at least one module.`);
  }
  const enrollment = await systemeIoCommon.apiCall<unknown>({
    method: HttpMethod.POST,
    url: `/school/courses/${course}/enrollments`,
    auth: apiKey,
    body: {
      contactId: contact,
      accessType: access,
      ...(partial ? { modules: moduleIds } : {}),
    },
  });
  return enrollmentRow(enrollment);
}

const ACCESS_TYPES = ['full_access', 'partial_access', 'dripping_content', 'partial_dripping_access'];
