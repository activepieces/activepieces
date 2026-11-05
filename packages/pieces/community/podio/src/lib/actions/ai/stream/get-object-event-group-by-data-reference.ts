import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectEventGroupByDataReferenceOutputSchema } from '../../../output-schemas';

export const getObjectEventGroupByDataReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_object_event_group_by_data_reference',
  outputSchema: podioGetObjectEventGroupByDataReferenceOutputSchema,
  displayName: 'Get Object Event Group By Data Reference',
  description: 'Gets the activity group of an object that holds the event about a given comment, file or other data.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the one activity group of a Podio object, such as an item or status, that holds the event about the given data, such as a comment or file on that object. The object type and id come from a stream entry; the data type and id come from the data of an event in Get Object Event Groups or Get Stream Object.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "status" or "task", from the type of a stream entry.' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the id of a stream entry or from Filter Items.' }),
    dataRefType: podioAiProps.text({ required: true, displayName: 'Data Type', description: 'The type of the data the event is about, such as "comment" or "file".' }),
    dataRefId: podioAiProps.id({ required: true, displayName: 'Data ID', description: 'The id of that data, such as a comment id or file id.' }),
    eventTypes: podioAiProps.text({ required: false, displayName: 'Event Types', description: 'Comma-separated event types to return: comment, file, rating, creation, update, task, answer, rsvp, grant, reference. Groups without a matching event are left out. Defaults to all.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/${propsValue.refType}/${propsValue.refId}/activity_group/${propsValue.dataRefType}/${propsValue.dataRefId}`,
      query: podioUtils.query({ values: { event_types: propsValue.eventTypes } }),
    });
  },
});
