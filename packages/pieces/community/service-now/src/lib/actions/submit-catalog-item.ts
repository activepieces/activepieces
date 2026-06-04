import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { CatalogOrderResultSchema } from '../common/types';
import {
  catalogItemDropdown,
  createServiceNowClient,
  servicenowAuth,
  resolveSysId,
} from '../common/props';

const VariablesSchema = z.record(z.string(), z.unknown()).optional();
const QuantitySchema = z.number().int().min(1).max(100).default(1);

export const submitCatalogItemAction = createAction({
  auth: servicenowAuth,
  name: 'submit_catalog_item',
  displayName: 'Submit Catalog Request',
  description:
    'Order a catalog item. Submits a service catalog request and returns the resulting request number.',
  props: {
    item_sys_id: catalogItemDropdown,
    manual_item_sys_id: Property.ShortText({
      displayName: 'Or Enter Catalog Item Sys ID Manually',
      description:
        'Provide the catalog item sys_id directly if it is not in the dropdown',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'How many of this item to order',
      required: false,
      defaultValue: 1,
    }),
    requested_for: Property.ShortText({
      displayName: 'Requested For (User Sys ID)',
      description:
        'sys_id of the user the request is for. Defaults to the authenticated user.',
      required: false,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description:
        'Catalog item variables as a JSON object (variable_name → value)',
      required: false,
    }),
  },
  async run(context) {
    const { item_sys_id, manual_item_sys_id, quantity, requested_for, variables } =
      context.propsValue;

    const sysId = resolveSysId({
      selected: item_sys_id,
      manual: manual_item_sys_id,
      label: 'catalog item',
    });
    const parsedQuantity = QuantitySchema.parse(quantity ?? 1);
    const parsedVariables = VariablesSchema.parse(variables);

    const client = createServiceNowClient(context.auth);
    const result = await client.orderCatalogItem({
      item_sys_id: sysId,
      quantity: parsedQuantity,
      variables: parsedVariables,
      requested_for,
    });

    return CatalogOrderResultSchema.parse(result);
  },
});
