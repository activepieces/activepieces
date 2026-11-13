import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetRecurrenceOutputSchema } from '../../../output-schemas';

export const getRecurrenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_recurrence',
  outputSchema: podioGetRecurrenceOutputSchema,
  displayName: 'Get Recurrence',
  description: 'Gets the repeat schedule of an object, such as a task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the repeat schedule of one Podio object, such as a task: weekly, monthly or yearly, its step, weekdays and end date.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object that repeats, such as "task".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, e.g. a task id from List Tasks or Get Task.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/recurrence/${propsValue.refType}/${propsValue.refId}` });
  },
});
