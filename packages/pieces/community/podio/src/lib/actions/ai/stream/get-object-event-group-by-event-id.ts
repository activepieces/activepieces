import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectEventGroupByEventIdOutputSchema } from '../../../output-schemas';

export const getObjectEventGroupByEventIdAction = createAction({
  auth: podioAuth,
  name: 'podio_get_object_event_group_by_event_id',
  outputSchema: podioGetObjectEventGroupByEventIdOutputSchema,
  displayName: 'Get Object Event Group By Event ID',
  description: 'Gets the activity group of an object that holds a given event.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the one activity group of a Podio object, such as an item or status, that holds the given event. The object type and id come from a stream entry, and the event id from the events in its activity groups (Get Object Event Groups or Get Stream Object).',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "status" or "task", from the type of a stream entry.' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the id of a stream entry or from Filter Items.' }),
    eventId: podioAiProps.id({ required: true, displayName: 'Event ID', description: 'The id of an event, from the activity groups of Get Object Event Groups or Get Stream Object.' }),
    eventTypes: podioAiProps.text({ required: false, displayName: 'Event Types', description: 'Comma-separated event types to return: comment, file, rating, creation, update, task, answer, rsvp, grant, reference. Groups without a matching event are left out. Defaults to all.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/${propsValue.refType}/${propsValue.refId}/group/${propsValue.eventId}`,
      query: podioUtils.query({ values: { event_types: propsValue.eventTypes } }),
    });
  },
});
