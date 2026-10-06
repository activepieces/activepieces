import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatUsers } from '../common/users';

export const markLessonsCompletedAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_mark_lessons_completed',
  classification: 'WRITE',
  displayName: 'Mark Lessons Completed',
  description: "Adds lessons to a member's completed lessons. Never removes completions.",
  audience: 'both',
  aiMetadata: {
    description: "Marks one or more course lessons (by lesson ID, from List Courses) as completed for a member identified by email, at the given time or now. Use to sync progress from another learning tool. Heartbeat silently ignores unknown lesson IDs, so the result lists them in notConfirmed. If the read-back could not finish (more than 500 completions to scan, or a read error), the unchecked lessons are listed in unverified and checkComplete is false. It only adds completions and never removes any; marking an already completed lesson again changes nothing, so it is idempotent.",
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Member Email', required: true }),
    lessonIds: heartbeatProps.ids({ displayName: 'Lesson IDs', description: '1-100 lesson IDs. Use List Courses to find them.', required: true }),
    completedAt: Property.DateTime({ displayName: 'Completed At', description: 'When the lessons were completed. Defaults to now.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.markedLessons,
  async run({ auth, propsValue }) {
    const email = heartbeatApi.email({ value: propsValue.email, label: 'Member Email' });
    const lessonIds = heartbeatApi.uuidList({ value: propsValue.lessonIds, label: 'Lesson IDs', min: 1 });
    const completedAt = heartbeatApi.isoDate({ value: propsValue.completedAt, label: 'Completed At' }) ?? new Date().toISOString();
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/users',
      operation: 'mark lessons completed',
      body: { email, completedLessons: lessonIds.map((lessonID) => ({ lessonID, timestamp: completedAt })) },
    });
    const lookup = await heartbeatApi.afterWrite({
      what: "the member's completed lessons",
      load: () => completedLessonIds({ token: auth.secret_text, email, wanted: lessonIds }),
    });
    const found = lookup.value?.found ?? new Set<string>();
    const checkComplete = lookup.value?.complete ?? false;
    const missing = lessonIds.filter((id) => !found.has(id));
    return {
      email,
      lessonIds,
      completedAt,
      confirmed: lessonIds.filter((id) => found.has(id)),
      notConfirmed: checkComplete ? missing : [],
      unverified: checkComplete ? [] : missing,
      checkComplete,
      lookupError: lookup.lookupError,
    };
  },
});

async function completedLessonIds({ token, email, wanted }: { token: string; email: string; wanted: string[] }): Promise<CompletionCheck> {
  const user = await heartbeatUsers.findUserByEmail({ token, email });
  const userId = typeof user?.['id'] === 'string' ? user['id'] : undefined;
  if (userId === undefined) {
    return { found: new Set(), complete: true };
  }
  const found = new Set<string>();
  let startingAfter: string | undefined;
  for (let page = 0; page < MAX_VERIFY_PAGES; page++) {
    const items = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({
        token,
        method: HttpMethod.GET,
        path: `/users/${userId}/completed-lessons`,
        operation: 'list completed lessons',
        query: { limit: VERIFY_PAGE_SIZE, startingAfter },
      }),
    );
    items.forEach((item) => {
      if (typeof item['lessonID'] === 'string') {
        found.add(item['lessonID']);
      }
    });
    const last = items[items.length - 1]?.['lessonID'];
    if (wanted.every((id) => found.has(id)) || items.length < VERIFY_PAGE_SIZE || typeof last !== 'string') {
      return { found, complete: true };
    }
    startingAfter = last;
  }
  return { found, complete: false };
}

type CompletionCheck = { found: Set<string>; complete: boolean };

const MAX_VERIFY_PAGES = 5;
const VERIFY_PAGE_SIZE = 100;
