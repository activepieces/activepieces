import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const getJobEvents = createAction({
  auth: jungleGridAuth,
  name: 'get_job_events',
  displayName: 'Get Job Events',
  description:
    'Retrieve platform lifecycle events for a job. Events can appear during scheduling and startup before workload logs exist.',
  props: {
    job_id: jungleGridCommon.jobId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of lifecycle events to return when supported by the API.',
      required: false,
      defaultValue: 100,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Optional cursor from a previous Get Job Events response.',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Event Type',
      description: 'Optional event type filter when supported by Jungle Grid. Leave blank to return all lifecycle events.',
      required: false,
    }),
    since: Property.ShortText({
      displayName: 'Since',
      description: 'Optional ISO timestamp filter when supported by Jungle Grid.',
      required: false,
    }),
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobEvents(context.propsValue.job_id),
      queryParams: jungleGridCommon.buildEventsQueryParams(context.propsValue),
    });
  },
});
