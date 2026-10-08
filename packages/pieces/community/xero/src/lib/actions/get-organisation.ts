import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetOrganisation = createAction({
  auth: xeroAuth,
  name: 'xero_get_organisation',
  classification: 'READ',
  displayName: 'Get Organisation Details',
  description: 'Gets the settings of a Xero organisation, such as base currency, tax settings and financial year end.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the selected Xero organisation\'s settings: name, base currency, country, timezone, tax defaults and financial year end. Use it before creating documents to pick the right currency or report period. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.organisation,
  props: {
    tenant_id: props.tenant_id,
  },
  async run(context) {
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Organisation`,
      operation: 'get organisation',
    });
    const organisation = xeroApi.firstRecord({ body, key: 'Organisations', operation: 'get organisation' });
    return Object.fromEntries(Object.entries(organisation).filter(([key]) => key !== 'APIKey'));
  },
});
