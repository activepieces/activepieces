import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import { supplierDropdown } from '../common/props';
import { formatCoupaOutputs } from '../common/utils';

export const getSupplierSites = createAction({
  auth: coupaAuth,
  name: 'get_supplier_sites_by_supplier',
  displayName: 'Get Supplier Sites by Supplier',
  description:
    'Lists supplier sites for a supplier (`GET /api/suppliers/:id/supplier_sites`).',
  audience: 'both',
  aiMetadata: {
    description:
      'List all supplier sites (locations/storefronts) configured under a given Coupa supplier ID. Use this to enumerate a supplier\'s sites; use Get Remit-To Addresses for payment addresses instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    supplierId: supplierDropdown,
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const result = await client.request<Record<string, unknown>[]>({
      method: HttpMethod.GET,
      resourceUri: `/suppliers/${propsValue.supplierId}/supplier_sites`,
    });
    const list = Array.isArray(result) ? result : [result];
    const formatted = formatCoupaOutputs(list, 'suppliers');
    return {
      total_count: formatted.length,
      supplier_sites: formatted,
    };
  },
});
