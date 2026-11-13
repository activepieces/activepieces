import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectEventGroupsOutputSchema } from '../../../output-schemas';

export const getObjectEventGroupsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_object_event_groups',
  outputSchema: podioGetObjectEventGroupsOutputSchema,
  displayName: 'Get Object Event Groups',
  description: 'Lists the grouped activity history of one object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the activity groups of one Podio object, such as an item or status, most recent first, paged with limit and offset or bounded by group ids. Use Get Stream Object for only the latest activity. The type and id come from a stream entry or, for items, from Filter Items.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "status" or "task", from the type of a stream entry.' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the id of a stream entry or from Filter Items.' }),
    eventTypes: podioAiProps.text({ required: false, displayName: 'Event Types', description: 'Comma-separated event types to return: comment, file, rating, creation, update, task, answer, rsvp, grant, reference. Groups without a matching event are left out. Defaults to all.' }),
    fromGroupId: podioAiProps.id({ required: false, displayName: 'From Group ID', description: 'The id of the first group to return, from an earlier call.' }),
    toGroupId: podioAiProps.id({ required: false, displayName: 'To Group ID', description: 'The id of the last group to return, from an earlier call.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of groups to return. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/${propsValue.refType}/${propsValue.refId}/activity_group/`,
      query: podioUtils.query({
        values: {
          event_types: propsValue.eventTypes,
          from_group_id: propsValue.fromGroupId,
          to_group_id: propsValue.toGroupId,
          limit: propsValue.limit ?? 20,
          offset: propsValue.offset,
        },
      }),
    });
    return { groups: body, count: body.length };
  },
});
