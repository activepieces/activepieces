import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../../common/auth';
import { systemeIoInput } from '../../common/client';
import { enrollmentRow } from '../../common/mappers';
import { aiListEnrollmentsOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeListEnrollments = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_enrollments',
  classification: 'SEARCH',
  displayName: 'List Course Enrollments',
  description: 'List course enrollments, filtered by course and/or contact',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Systeme.io course enrollments (enrollment id, access type, course and contact), optionally filtered by course_id and/or contact_id. Use to check whether a contact already has access to a course before enrolling or removing them. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    course_id: Property.ShortText({
      displayName: 'Course ID',
      description: 'Optional numeric course id (from systeme_list_courses).',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Optional numeric contact id (from find_contacts or a trigger).',
      required: false,
    }),
    max_results: aiCommon.maxResultsProp,
    starting_after: aiCommon.startingAfterProp,
  },
  outputSchema: aiListEnrollmentsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const course = systemeIoInput.optionalId({ value: p.course_id, name: 'course_id' });
    const contact = systemeIoInput.optionalId({ value: p.contact_id, name: 'contact_id' });
    const result = await aiCommon.list({
      apiKey: context.auth.secret_text,
      url: '/school/enrollments',
      query: { course, contact },
      maxResults: p.max_results,
      startingAfter: p.starting_after,
      map: enrollmentRow,
    });
    const enrollments = result.items.filter(
      (row) => (course === undefined || Number(row.course_id) === course) && (contact === undefined || Number(row.contact_id) === contact),
    );
    return { enrollments, count: enrollments.length, has_more: result.has_more, next_cursor: result.next_cursor };
  },
});
