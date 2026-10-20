import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroListTrackingCategories = createAction({
  auth: xeroAuth,
  name: 'xero_list_tracking_categories',
  classification: 'SEARCH',
  displayName: 'List Tracking Categories',
  description: 'Lists tracking categories (such as Region or Department) and their options.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the organisation\'s tracking categories (for example Region or Department) with their options, which line items reference as Tracking {Name, Option}. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.trackingCategories,
  props: {
    tenant_id: props.tenant_id,
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
  },
  async run(context) {
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/TrackingCategories`,
      queryParams: context.propsValue.include_archived ? { includeArchived: 'true' } : {},
      operation: 'list tracking categories',
    });
    const items = xeroApi.recordsOf({ body, key: 'TrackingCategories' });
    return { items, count: items.length };
  },
});
