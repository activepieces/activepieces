import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { omnisendAuth } from '../auth';
import { omnisendRequest } from '../common/client';

export const listCampaignsAction = createAction({
  auth: omnisendAuth,
  name: 'list_campaigns',
  displayName: 'List Campaigns',
  description: 'Retrieve a list of email campaigns.',
  audience: 'both',
  aiMetadata: {
    description:
      'List email campaigns from Omnisend with limit/offset pagination. Leave Status empty to return campaigns of all statuses, or set it to filter to a single state (draft, scheduled, sending, or sent). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of campaigns to return.',
      required: false,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of campaigns to skip for pagination.',
      required: false,
      defaultValue: 0,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter campaigns by status.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
        ],
      },
    }),
  },
  async run(context) {
    const { limit, offset, status } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);
    if (offset !== undefined && offset !== null) queryParams['offset'] = String(offset);
    if (status) queryParams['status'] = status;

    return omnisendRequest(
      HttpMethod.GET,
      '/campaigns',
      context.auth.secret_text,
      undefined,
      queryParams,
    );
  },
});
