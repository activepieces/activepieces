import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listCoursesAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_courses',
  classification: 'SEARCH',
  displayName: 'List Courses',
  description: 'Lists courses with their cohorts, modules and lessons.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every course with its cohorts, modules and lessons (IDs and names). Use to find lesson IDs for Get Lesson or Mark Lessons Completed. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: heartbeatOutputSchemas.courseList,
  async run({ auth }) {
    const courses = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/courses', operation: 'list courses' }),
    );
    return { courses, count: courses.length };
  },
});
