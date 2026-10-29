import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Extension } from '../../../common/types';
import { outlookCalendarExtensionOutputSchema } from '../../../output-schemas';

export const outlookCalendarUpdateEventExtensionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_update_event_extension',
  outputSchema: outlookCalendarExtensionOutputSchema,
  displayName: 'Update Event Extension',
  description: 'Changes or adds custom data in an open extension on an event.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an open extension on an event: each given property is changed or added, and properties not given keep their values; null values are not accepted, so a property cannot be removed. If the event has no extension with that name, one is created. The extension name comes from Create Event Extension.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    extensionName: Property.ShortText({
      displayName: 'Extension Name',
      description:
        'The extensionName of the extension to update (e.g. "Com.Contoso.Referral"), from Create Event Extension.',
      required: true,
    }),
    customData: Property.Json({
      displayName: 'Custom Data',
      description:
        'JSON object of the custom properties to change or add, e.g. {"dealValue": 600}. Values must be primitives or arrays of primitives.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response: Extension = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/events/${encodeURIComponent(propsValue.eventId)}/extensions/${encodeURIComponent(
          propsValue.extensionName,
        )}`,
      )
      .patch({
        ...propsValue.customData,
        '@odata.type': 'microsoft.graph.openTypeExtension',
        extensionName: propsValue.extensionName,
      });
    return response;
  },
});
