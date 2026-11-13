import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeleteCalendarGroupAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_delete_calendar_group',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Delete Calendar Group',
  description: 'Deletes a calendar group.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Deletes a calendar group, whose ID comes from List Calendar Groups. The default calendar group can't be deleted.",
    idempotent: false,
  },
  props: {
    calendarGroupId: outlookCalendarAiProps.calendarGroupId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendarGroups/${encodeURIComponent(propsValue.calendarGroupId)}`)
      .delete();
    return { success: true };
  },
});
