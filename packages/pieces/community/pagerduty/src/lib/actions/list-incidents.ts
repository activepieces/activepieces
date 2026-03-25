import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from '../common/client';
import { optionalUrgencyProp, statusesProp } from '../common/props';

export const listIncidents = createAction({
  auth: pagerDutyAuth,
  name: 'list_incidents',
  displayName: 'List Incidents',
  description: 'List PagerDuty incidents with optional filters.',
  props: {
    statuses: statusesProp,
    urgency: optionalUrgencyProp,
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Optional start of the search window.',
      required: false,
    }),
    until: Property.DateTime({
      displayName: 'Until',
      description: 'Optional end of the search window.',
      required: false,
    }),
  },
  async run(context) {
    const { statuses, urgency, since, until } = context.propsValue;

    const query: Record<string, string | string[] | undefined> = {
      since: since || undefined,
      until: until || undefined,
    };

    if (statuses && statuses.length > 0) {
      query['statuses[]'] = statuses as string[];
    }

    if (urgency) {
      query['urgencies[]'] = [String(urgency)];
    }

    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/incidents',
      query,
    });

    return (response as { incidents?: unknown }).incidents ?? response;
  },
});
