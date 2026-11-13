import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetGlobalStreamOutputSchema } from '../../../output-schemas';

export const getOrganizationStreamAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_stream',
  outputSchema: podioGetGlobalStreamOutputSchema,
  displayName: 'Get Organization Stream',
  description: 'Gets the activity stream of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Reads the activity stream of one Podio organization, newest first, paged with limit and offset. Each entry is an object (such as an item or status) with its latest activity grouped; its type and id feed Get Stream Object and Get Object Event Groups. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    groupsEventTypes: podioAiProps.text({ required: false, displayName: 'Event Types', description: 'Comma-separated event types to include in the activity groups: comment, file, rating, creation, update, task, answer, rsvp, grant. Defaults to all.' }),
    groupsLimit: podioAiProps.number({ required: false, displayName: 'Events Per Group', description: 'Maximum number of events returned in each activity group. Defaults to 2.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of stream entries to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/stream/org/${propsValue.orgId}/v3/`,
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
