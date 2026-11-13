import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListSpaceStreamEventsOutputSchema } from '../../../output-schemas';

export const listSpaceStreamEventsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_space_stream_events',
  outputSchema: podioListSpaceStreamEventsOutputSchema,
  displayName: 'List Space Stream Events',
  description: 'Lists the activity stream of a workspace in the older ungrouped format.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the activity stream of one Podio workspace in the older format, one entry per object with its recent comments, files and activity, newest first, paged with limit and offset. Prefer Get Space Stream for grouped activity. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of stream entries to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/space/${propsValue.spaceId}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit ?? 10, offset: propsValue.offset } }),
    });
    return { events: body, count: body.length };
  },
});
