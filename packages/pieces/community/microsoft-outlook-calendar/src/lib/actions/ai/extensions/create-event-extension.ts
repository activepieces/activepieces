import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Extension } from '../../../common/types';
import { outlookCalendarExtensionOutputSchema } from '../../../output-schemas';

export const outlookCalendarCreateEventExtensionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_create_event_extension',
  outputSchema: outlookCalendarExtensionOutputSchema,
  displayName: 'Create Event Extension',
  description: 'Stores custom data on an event as an open extension.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an open extension on an event that stores custom key-value data under a unique extensionName in reverse-DNS form (e.g. "Com.Contoso.Referral"). If the event already has an extension with that name, its data is replaced, so read it first with Get Event Extension when it must be kept. The event ID comes from List Events or Create Event.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    extensionName: Property.ShortText({
      displayName: 'Extension Name',
      description:
        'Unique name for the extension in reverse-DNS form, e.g. "Com.Contoso.Referral".',
      required: true,
    }),
    customData: Property.Json({
      displayName: 'Custom Data',
      description:
        'JSON object of the custom properties to store, e.g. {"companyName": "Contoso", "dealValue": 500}. Values must be primitives or arrays of primitives.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response: Extension = await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}/extensions`)
      .post({
        ...propsValue.customData,
        '@odata.type': 'microsoft.graph.openTypeExtension',
        extensionName: propsValue.extensionName,
      });
    return response;
  },
});
