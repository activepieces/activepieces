import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroListTaxRates = createAction({
  auth: xeroAuth,
  name: 'xero_list_tax_rates',
  classification: 'SEARCH',
  displayName: 'List Tax Rates',
  description: 'Lists the tax rates of the organisation and the TaxType codes to use on line items.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the organisation\'s tax rates with the TaxType code to put on invoice, bill and transaction lines, the effective rate and which account types each applies to. Use it before creating documents with tax. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.taxRates,
  props: {
    tenant_id: props.tenant_id,
    tax_type: Property.ShortText({ displayName: 'Tax Type', description: 'Only the rate with this TaxType code, e.g. OUTPUT.', required: false }),
    active_only: Property.Checkbox({ displayName: 'Active Only', required: false, defaultValue: true }),
  },
  async run(context) {
    const taxType = xeroInput.trimmedOrUndefined({ value: context.propsValue.tax_type });
    const where = [
      ...(taxType ? [`TaxType==${xeroInput.whereString({ value: taxType })}`] : []),
      ...(context.propsValue.active_only === false ? [] : ['Status=="ACTIVE"']),
    ];
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/TaxRates`,
      queryParams: where.length > 0 ? { where: where.join(' AND ') } : {},
      operation: 'list tax rates',
    });
    const items = xeroApi.recordsOf({ body, key: 'TaxRates' });
    return { items, count: items.length };
  },
});
