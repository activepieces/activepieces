import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemFieldCalendarAsIcalOutputSchema } from '../../../output-schemas';

export const getTaskCalendarAsIcalAction = createAction({
  auth: podioAuth,
  name: 'podio_get_task_calendar_as_ical',
  outputSchema: podioGetItemFieldCalendarAsIcalOutputSchema,
  displayName: 'Get Task Calendar as iCal',
  description: 'Gets a task as an iCal (.ics) event.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the due date of one Podio task as iCal (text/calendar) text, for adding it to another calendar tool. The task id comes from List Tasks or Get Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
  },
  async run({ auth, propsValue }) {
    const ical = await podioClient.request<string>({ auth, method: HttpMethod.GET, path: `/calendar/task/${propsValue.taskId}/ics/` });
    return { ical };
  },
});
