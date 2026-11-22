import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { send21Auth } from '../auth';
import { authKey, send21Request } from '../common/client';

export const getDraft = createAction({
  auth: send21Auth,
  name: 'get_draft',
  classification: 'READ',
  displayName: 'Get Draft',
  description: 'Read a draft, including amounts, fee, quote and core hash (GET /drafts/{id}).',
  audience: 'both',
  aiMetadata: {
    description:
      'Read one send21 draft by id: amounts, fee, quote and status. Use Get Draft Status for a lighter status-only check. Safe to retry.',
    idempotent: true,
  },
  props: {
    draftId: Property.ShortText({
      displayName: 'Draft ID',
      required: true,
    }),
  },
  async run(context) {
    return send21Request({
      apiKey: authKey(context.auth),
      method: HttpMethod.GET,
      path: `/drafts/${context.propsValue.draftId}`,
    });
  },
});

export const getDraftStatus = createAction({
  auth: send21Auth,
  name: 'get_draft_status',
  classification: 'READ',
  displayName: 'Get Draft Status',
  description:
    'Read the status snapshot: AwaitingPayment, Seen, Confirmed, Expired or Cancelled (GET /drafts/{id}/status). Prefer the webhook trigger over polling.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read only the status of one send21 draft (AwaitingPayment, Seen, Confirmed, Expired or Cancelled). Prefer the Payment Event trigger over polling. Safe to retry.',
    idempotent: true,
  },
  props: {
    draftId: Property.ShortText({
      displayName: 'Draft ID',
      required: true,
    }),
  },
  async run(context) {
    return send21Request({
      apiKey: authKey(context.auth),
      method: HttpMethod.GET,
      path: `/drafts/${context.propsValue.draftId}/status`,
    });
  },
});
