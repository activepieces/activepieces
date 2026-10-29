import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Extension } from '../../../common/types';
import { outlookCalendarExtensionOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetEventExtensionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_event_extension',
  outputSchema: outlookCalendarExtensionOutputSchema,
  displayName: 'Get Event Extension',
  description: 'Gets one open extension (custom data) on an event.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one open extension on an event with its custom data. The extension is identified by its extensionName (e.g. "Com.Contoso.Referral") or its ID, from Create Event Extension.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    extensionId: outlookCalendarAiProps.extensionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: Extension = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/events/${encodeURIComponent(propsValue.eventId)}/extensions/${encodeURIComponent(
          propsValue.extensionId,
        )}`,
      )
      .get();
    return response;
  },
});
