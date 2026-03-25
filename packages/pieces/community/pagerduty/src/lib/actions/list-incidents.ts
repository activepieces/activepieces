import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from '../common/client';
import { optionalUrgencyProp, statusesProp } from '../common/props';

export const listIncidents = createAction({
  auth: pagerDutyAuth,
  name: 'list_incidents',
  displayName: 'List Incidents',
  description: 'List PagerDuty incidents with optional filters and pagination.',
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
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of incidents to return (1–100).',
      required: false,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Pagination offset (number of records to skip).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { statuses, urgency, since, until, limit, offset } =
      context.propsValue;

    const rawLimit = limit ?? 25;
    const clampedLimit = Math.max(1, Math.min(100, rawLimit));

    const query: Record<string, string | string[] | undefined> = {
      since: since || undefined,
      until: until || undefined,
      limit: String(clampedLimit),
      offset: String(Math.max(0, offset ?? 0)),
    };

    if (statuses && statuses.length > 0) {
      query['statuses[]'] = statuses as string[];
    }

    if (urgency) {
      query['urgencies[]'] = [urgency];
    }

    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/incidents',
      query,
    });

    return response;
  },
});
