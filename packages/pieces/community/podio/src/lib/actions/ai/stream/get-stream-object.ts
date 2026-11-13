import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetStreamObjectOutputSchema } from '../../../output-schemas';

export const getStreamObjectAction = createAction({
  auth: podioAuth,
  name: 'podio_get_stream_object',
  outputSchema: podioGetStreamObjectOutputSchema,
  displayName: 'Get Stream Object',
  description: 'Gets the stream view of one object with its latest activity.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio object, such as an item or status, as it appears in the stream, with its latest activity grouped. Use Get Object Event Groups for its full activity history. The type and id come from a stream entry or, for items, from Filter Items.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "status" or "task", from the type of a stream entry.' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the id of a stream entry or from Filter Items.' }),
    groupsEventTypes: podioAiProps.text({ required: false, displayName: 'Event Types', description: 'Comma-separated event types to include in the activity groups: comment, file, rating, creation, update, task, answer, rsvp, grant, reference. Defaults to all.' }),
    groupsLimit: podioAiProps.number({ required: false, displayName: 'Events Per Group', description: 'Maximum number of events returned in each activity group. Defaults to 2.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/${propsValue.refType}/${propsValue.refId}/v3`,
      query: podioUtils.query({ values: { groups_event_types: propsValue.groupsEventTypes, groups_limit: propsValue.groupsLimit } }),
    });
  },
});
