import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  purchaseOrderDropdown,
  remitToParentTypeProperty,
  supplierDropdown,
} from '../common/props';
import { flattenRecords, isRecord } from '../common/utils';

export const getRemitToAddresses = createAction({
  auth: coupaAuth,
  name: 'get_remit_to_addresses_by_object_id',
  displayName: 'Get Remit-To Addresses by Object ID',
  description:
    'Lists remit-to addresses for a Supplier or resolves the supplier from a Purchase Order.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the remit-to (payment) addresses on file for a Coupa supplier. Works in two modes: pass a supplier ID directly, or pass a purchase order ID and it resolves the linked supplier first (failing if the order has no supplier). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    parentModule: remitToParentTypeProperty,
    parentRecord: Property.DynamicProperties({
      displayName: 'Record',
      required: true,
      refreshers: ['parentModule'],
      auth: coupaAuth,
      props: async ({ parentModule }) => {
        if (parentModule === 'suppliers') {
          return { recordId: supplierDropdown };
        }
        if (parentModule === 'purchase_orders') {
          return { recordId: purchaseOrderDropdown };
        }
        return {
          recordId: Property.ShortText({
            displayName: 'Record ID',
            description: 'Select a parent module first.',
            required: true,
          }),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const recordId = propsValue.parentRecord['recordId'];
    let path: string;

    if (propsValue.parentModule === 'suppliers') {
      path = `/suppliers/${recordId}/addresses`;
    } else {
      const po = await client.request<Record<string, unknown>>({
        method: HttpMethod.GET,
        resourceUri: `/purchase_orders/${recordId}`,
        query: { fields: '["id","supplier"]' },
      });
      const supplier = po['supplier'];
      const supplierId =
        (isRecord(supplier) ? supplier['id'] : undefined) ?? po['supplier-id'];
      if (!supplierId) {
        throw new Error('Purchase order has no linked supplier.');
      }
      path = `/suppliers/${supplierId}/addresses`;
    }

    const result = await client.request<Record<string, unknown>[]>({
      method: HttpMethod.GET,
      resourceUri: path,
    });
    const list = Array.isArray(result) ? result : [result];
    const formatted = flattenRecords(list);
    return {
      total_count: formatted.length,
      addresses: formatted,
    };
  },
});
