import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../../common/auth';
import { courseRow } from '../../common/mappers';
import { aiListCoursesOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeListCourses = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_courses',
  classification: 'SEARCH',
  displayName: 'List Courses',
  description: 'List courses, optionally filtered by name or active state',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Systeme.io courses with their id, name, active state and modules (id and name). Use to find the course_id and module ids needed by enroll_contact_in_course and remove_course_enrollment; the search text also matches module and lecture names. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Optional text matched against course, module or lecture names.',
      required: false,
    }),
    active: Property.ShortText({
      displayName: 'Active Filter',
      description: 'Optional. "true" lists active courses only, "false" inactive only; leave empty for all.',
      required: false,
    }),
    max_results: aiCommon.maxResultsProp,
    starting_after: aiCommon.startingAfterProp,
  },
  outputSchema: aiListCoursesOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const result = await aiCommon.list({
      apiKey: context.auth.secret_text,
      url: '/school/courses',
      query: { query: p.query?.trim() || undefined, active: aiCommon.optionalBoolean({ value: p.active, name: 'active' }) },
      maxResults: p.max_results,
      startingAfter: p.starting_after,
      map: courseRow,
    });
    return { courses: result.items, count: result.count, has_more: result.has_more, next_cursor: result.next_cursor };
  },
});
