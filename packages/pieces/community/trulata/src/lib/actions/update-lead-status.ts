import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trulataAuth } from '../auth';
import { LEAD_STATUSES, trulataRequest } from '../common';

export const updateLeadStatus = createAction({
  auth: trulataAuth,
  name: 'update_lead_status',
  displayName: 'Update Lead Status',
  description: 'Marks a lead contacted, quoted, won, lost or not a lead.',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The id from a TruLata trigger, Find Lead or List Leads. It starts with ld_.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: { options: LEAD_STATUSES },
    }),
    note: Property.ShortText({ displayName: 'Note', required: false }),
  },
  async run(context) {
    const { lead_id, status, note } = context.propsValue;
    const res = await trulataRequest<{ lead: Record<string, unknown> }>(
      context.auth.secret_text,
      HttpMethod.POST,
      `/leads/${encodeURIComponent(lead_id)}/status`,
      { status, note }
    );
    return res.lead;
  },
});
