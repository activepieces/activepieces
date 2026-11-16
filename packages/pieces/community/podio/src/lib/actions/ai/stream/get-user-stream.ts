import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetGlobalStreamOutputSchema } from '../../../output-schemas';

export const getUserStreamAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_stream',
  outputSchema: podioGetGlobalStreamOutputSchema,
  displayName: 'Get User Stream',
  description: 'Gets the activity stream of a user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Reads the activity of one Podio user that the active user can see, newest first, paged with limit and offset. Each entry is an object (such as an item or status) with its latest activity grouped; its type and id feed Get Stream Object and Get Object Event Groups. The user id comes from Get User or Get Organization Members.',
    idempotent: true,
  },
  props: {
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The user_id of the user, from Get User or Get Organization Members.' }),
    groupsEventTypes: podioAiProps.text({ required: false, displayName: 'Event Types', description: 'Comma-separated event types to include in the activity groups: comment, file, rating, creation, update, task, answer, rsvp, grant. Defaults to all.' }),
    groupsLimit: podioAiProps.number({ required: false, displayName: 'Events Per Group', description: 'Maximum number of events returned in each activity group. Defaults to 2.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of stream entries to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/user/${propsValue.userId}/v3`,
      query: podioUtils.query({
        values: {
          groups_event_types: propsValue.groupsEventTypes,
          groups_limit: propsValue.groupsLimit,
          limit: propsValue.limit ?? 10,
          offset: propsValue.offset,
        },
      }),
    });
    return { events: body, count: body.length };
  },
});
