import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeleteEventExtensionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_delete_event_extension',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Delete Event Extension',
  description: 'Permanently deletes an open extension and its custom data from an event.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one open extension and all its custom data from an event; it cannot be recovered. The extension is identified by its extensionName or ID, from Create Event Extension.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    extensionId: outlookCalendarAiProps.extensionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/events/${encodeURIComponent(propsValue.eventId)}/extensions/${encodeURIComponent(
          propsValue.extensionId,
        )}`,
      )
      .delete();
    return { success: true };
  },
});
