import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const getLessonAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_lesson',
  classification: 'READ',
  displayName: 'Get Lesson',
  description: 'Gets one course lesson with its Markdown content.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one course lesson by ID with title, Markdown content, author and embedded cards. Use to read or summarise lesson material; get the ID from List Courses. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lessonId: heartbeatProps.id({ displayName: 'Lesson ID', description: 'Use List Courses to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.lesson,
  async run({ auth, propsValue }) {
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/lessons/${heartbeatApi.uuid({ value: propsValue.lessonId, label: 'Lesson ID' })}`,
      operation: 'get lesson',
    });
  },
});
