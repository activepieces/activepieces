import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';
import { askHandleApiCall } from '../common/client';

export const listLeads = createAction({
  auth: askHandleAuth,
  name: 'list_leads',
  displayName: 'List Leads',
  description: 'Get a list of all leads',
  props: {
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Filter leads from this date',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'Filter leads until this date',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of leads to return',
      required: false,
    }),
  },
  async run(context) {
    const { start_date, end_date, limit } = context.propsValue;

    const queryParams: string[] = [];
    if (start_date) {
      const dateStr = new Date(start_date).toISOString().split('T')[0];
      queryParams.push(`start_date=${dateStr}`);
    }
    if (end_date) {
      const dateStr = new Date(end_date).toISOString().split('T')[0];
      queryParams.push(`end_date=${dateStr}`);
    }
    if (limit) {
      queryParams.push(`limit=${limit}`);
    }

    const path = queryParams.length > 0
      ? `/leads/?${queryParams.join('&')}`
      : '/leads/';

    return await askHandleApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      path
    );
  },
});

