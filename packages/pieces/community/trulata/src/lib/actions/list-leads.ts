import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataAuth } from '../auth';
import { trulataRequest } from '../common';

export const listLeads = createAction({
  auth: trulataAuth,
  name: 'list_leads',
  displayName: 'List Leads',
  description: 'Lists the newest leads, newest first.',
  props: {
    days: Property.Number({
      displayName: 'Days Back',
      description: 'How many days of leads to look at (default 30).',
      required: false,
      defaultValue: 30,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Up to 100 (default 50).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const res = await trulataRequest<{ leads: unknown[] }>(
      context.auth.secret_text,
      HttpMethod.GET,
      '/leads',
      undefined,
      {
        days: String(context.propsValue.days ?? 30),
        limit: String(context.propsValue.limit ?? 50),
      }
    );
    return res.leads;
  },
});
