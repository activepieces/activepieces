import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listUserCompletedLessonsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_user_completed_lessons',
  classification: 'SEARCH',
  displayName: 'List Completed Lessons',
  description: "Lists a member's completed course lessons, newest completion first.",
  audience: 'both',
  aiMetadata: {
    description: "Lists the course lessons a member has completed (lesson ID and completion time), newest first, one page at a time. Use to check course progress; pass nextCursor as Starting After for the next page. hasMore can be true on an exactly full last page. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    userId: heartbeatProps.id({ displayName: 'User ID', description: 'Use List Members to find the ID.', required: true }),
    limit: heartbeatProps.limit({ max: 100, defaultValue: 50 }),
    startingAfter: heartbeatProps.startingAfter(),
  },
  outputSchema: heartbeatOutputSchemas.completedLessons,
  async run({ auth, propsValue }) {
    const pageLimit = heartbeatApi.limit({ value: propsValue.limit, max: 100, defaultValue: 50 });
    const items = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({
        token: auth.secret_text,
        method: HttpMethod.GET,
        path: `/users/${heartbeatApi.uuid({ value: propsValue.userId, label: 'User ID' })}/completed-lessons`,
        operation: 'list completed lessons',
        query: {
          limit: pageLimit,
          startingAfter: heartbeatApi.optionalUuid({ value: propsValue.startingAfter, label: 'Starting After' }),
        },
      }),
    );
    const last = items[items.length - 1]?.['lessonID'];
    const hasMore = items.length >= pageLimit;
    return { items, nextCursor: hasMore && typeof last === 'string' ? last : null, hasMore };
  },
});
